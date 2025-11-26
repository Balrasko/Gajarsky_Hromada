import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import { Exception } from '@adonisjs/core/build/standalone'

import {
  ChannelDto,
  ChannelMemberDto,
  CommandResultDto,
  MessageDto,
  TypingStateDto
} from '@vpwa/shared'

import Channel from 'App/Models/Channel'
import ChannelBan from 'App/Models/ChannelBan'
import ChannelDraft from 'App/Models/ChannelDraft'
import ChannelKickVote from 'App/Models/ChannelKickVote'
import ChannelMembership from 'App/Models/ChannelMembership'
import Message from 'App/Models/Message'
import User from 'App/Models/User'
import UserPreference from 'App/Models/UserPreference'
import type { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'

const KICK_VOTE_THRESHOLD = 3

class ChatService {
  private async ensureUser(userId: string) {
    const user = await User.find(userId)

    if (!user) {
      throw new Exception('User not found', 404)
    }

    return user
  }

  private async ensureChannel(channelId: string) {
    const channel = await Channel.find(channelId)

    if (!channel || channel.isArchived) {
      throw new Exception('Channel not found', 404)
    }

    return channel
  }

  private async ensureMembership(channelId: string, userId: string) {
    const membership = await ChannelMembership.query()
      .where('channelId', channelId)
      .andWhere('userId', userId)
      .first()

    if (!membership) {
      throw new Exception('Membership not found', 404)
    }

    return membership
  }

  private sanitizeChannelName(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_\s]/g, '')
      .replace(/\s+/g, '-')
  }

  private async pruneInactiveChannels() {
    const cutoff = DateTime.utc().minus({ days: 30 })

    const inactive = await Channel.query()
      .where('isArchived', false)
      .andWhere('lastActivityAt', '<', cutoff.toSQL())

    if (inactive.length === 0) {
      return
    }

    const ids = inactive.map((channel) => channel.id)
    await Channel.query().whereIn('id', ids).delete()
  }

  private mapMembers(memberships: ChannelMembership[]): ChannelMemberDto[] {
    return memberships.map((membership) => {
      const user = membership.$preloaded.user as User

      return {
        id: membership.userId,
        nickName: user.nickName,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        role: membership.role
      }
    })
  }

  private buildChannelDto(channel: Channel, membership: ChannelMembership, members: ChannelMemberDto[]): ChannelDto {
    const now = DateTime.utc()
    const highlighted =
      membership.status === 'invited' ||
      (membership.highlightUntil !== null && membership.highlightUntil > now)

    return {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      ownerId: channel.ownerId,
      members,
      lastActivityAt: channel.lastActivityAt?.toISO() ?? null,
      membershipStatus: membership.status,
      isOwner: membership.role === 'owner',
      unreadCount: membership.unreadCount,
      highlightedUntil: highlighted ? (membership.highlightUntil?.toISO() ?? now.toISO()) : null
    }
  }

  public async getUserChannels(userId: string): Promise<ChannelDto[]> {
    await this.ensureUser(userId)
    await this.pruneInactiveChannels()

    const memberships = await ChannelMembership.query()
      .where('userId', userId)
      .preload('channel', (builder: ModelQueryBuilderContract<typeof Channel>) => {
        builder
          .where('isArchived', false)
          .preload('memberships', (membershipBuilder: ModelQueryBuilderContract<typeof ChannelMembership>) => {
            membershipBuilder
              .where('status', 'active')
              .preload('user', (userBuilder: ModelQueryBuilderContract<typeof User>) => {
                userBuilder.preload('preference', (prefBuilder) => prefBuilder.limit(1))
              })
          })
      })
      .orderBy('status', 'desc')

    const filtered = memberships.filter((membership) => membership.channel !== null)
    const now = DateTime.utc()

    for (const membership of filtered) {
      const since = membership.lastReadAt ?? membership.joinedAt ?? now.minus({ years: 1 })

      const unreadResult = await Database.from('messages')
        .where('channel_id', membership.channelId)
        .andWhere('created_at', '>', since.toSQL())
        .count('* as total')

      const unreadRaw = unreadResult[0]?.total as string | number | undefined
      membership.unreadCount = typeof unreadRaw === 'string' ? parseInt(unreadRaw, 10) : (unreadRaw ?? 0)
    }

    const channelDtos = filtered.map((membership) => {
      const channel = membership.channel!

      const membershipModels = (channel.$preloaded.memberships as ChannelMembership[] | undefined) ?? []
      const members = this.mapMembers(membershipModels)

      return this.buildChannelDto(channel, membership, members)
    })

    channelDtos.sort((a, b) => {
      const highlightA = a.highlightedUntil ? Date.parse(a.highlightedUntil) : 0
      const highlightB = b.highlightedUntil ? Date.parse(b.highlightedUntil) : 0

      if (highlightA !== highlightB) {
        return highlightB - highlightA
      }

      const lastActivityA = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0
      const lastActivityB = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0

      return lastActivityB - lastActivityA
    })

    return channelDtos
  }

  private async channelMembers(channel: Channel): Promise<ChannelMemberDto[]> {
    await channel.load('memberships', (builder: ModelQueryBuilderContract<typeof ChannelMembership>) => {
      builder.where('status', 'active').preload('user', (userBuilder: ModelQueryBuilderContract<typeof User>) => {
        userBuilder.preload('preference', (prefBuilder) => prefBuilder.limit(1))
      })
    })

    return this.mapMembers(channel.memberships)
  }

  private async joinChannel(user: User, rawName: string, isPrivate: boolean): Promise<CommandResultDto> {
    const name = this.sanitizeChannelName(rawName)

    if (!name) {
      throw new Exception('Channel name required', 422)
    }

    const existingChannel = await Channel.query().where('name', name).first()

    if (!existingChannel) {
      const channel = await Channel.create({
        name,
        type: isPrivate ? 'private' : 'public',
        ownerId: user.id,
        lastActivityAt: DateTime.utc(),
        isArchived: false
      })

      const membership = await ChannelMembership.create({
        channelId: channel.id,
        userId: user.id,
        role: 'owner',
        status: 'active',
        joinedAt: DateTime.utc(),
        lastReadAt: DateTime.utc()
      })

      const members = await this.channelMembers(channel)

      return {
        success: true,
        feedback: `Channel #${channel.name} created and joined as owner`,
        channel: this.buildChannelDto(channel, membership, members)
      }
    }

    if (existingChannel.isArchived) {
      throw new Exception('Channel is archived', 410)
    }

    const existingMembership = await ChannelMembership.query()
      .where('channelId', existingChannel.id)
      .andWhere('userId', user.id)
      .first()

    if (existingMembership) {
      if (existingMembership.status === 'invited') {
        existingMembership.status = 'active'
        existingMembership.joinedAt = DateTime.utc()
        existingMembership.highlightUntil = DateTime.utc().plus({ hours: 2 })
        await existingMembership.save()

        const members = await this.channelMembers(existingChannel)

        return {
          success: true,
          feedback: `Invitation accepted. Welcome to #${existingChannel.name}.`,
          channel: this.buildChannelDto(existingChannel, existingMembership, members)
        }
      }

      return {
        success: false,
        feedback: `Already a member of #${existingChannel.name}.`
      }
    }

    if (existingChannel.type === 'private') {
      throw new Exception('Cannot join private channel without invite', 403)
    }

    const banned = await ChannelBan.query()
      .where('channelId', existingChannel.id)
      .andWhere('userId', user.id)
      .first()

    if (banned) {
      throw new Exception('You are banned from this channel', 403)
    }

    const membership = await ChannelMembership.create({
      channelId: existingChannel.id,
      userId: user.id,
      role: existingChannel.ownerId === user.id ? 'owner' : 'member',
      status: 'active',
      joinedAt: DateTime.utc(),
      lastReadAt: DateTime.utc(),
      highlightUntil: DateTime.utc().plus({ hours: 1 })
    })

    const members = await this.channelMembers(existingChannel)

    return {
      success: true,
      feedback: `Joined #${existingChannel.name}.`,
      channel: this.buildChannelDto(existingChannel, membership, members)
    }
  }

  private async inviteUser(requester: ChannelMembership, nickName: string): Promise<CommandResultDto> {
    const channel = requester.channel!

    const invitedUser = await User.query().where('nick_name', nickName).first()

    if (!invitedUser) {
      throw new Exception('User not found', 404)
    }

    const existingBan = await ChannelBan.query()
      .where('channelId', channel.id)
      .andWhere('userId', invitedUser.id)
      .first()

    if (existingBan && channel.type === 'public') {
      existingBan.delete()
    }

    let membership = await ChannelMembership.query()
      .where('channelId', channel.id)
      .andWhere('userId', invitedUser.id)
      .first()

    if (!membership) {
      membership = await ChannelMembership.create({
        channelId: channel.id,
        userId: invitedUser.id,
        role: channel.ownerId === invitedUser.id ? 'owner' : 'member',
        status: channel.type === 'private' ? 'invited' : 'active',
        joinedAt: channel.type === 'private' ? undefined : DateTime.utc(),
        highlightUntil: DateTime.utc().plus({ hours: 6 })
      })
    } else {
      membership.status = channel.type === 'private' ? 'invited' : 'active'
      membership.highlightUntil = DateTime.utc().plus({ hours: 6 })
      await membership.save()
    }

    const members = await this.channelMembers(channel)

    const feedback =
      membership.status === 'invited'
        ? `${nickName} invited. They need to accept the invitation.`
        : `${nickName} added to #${channel.name}.`

    return {
      success: true,
      feedback,
      channel: this.buildChannelDto(channel, requester, members),
      invite: {
        userId: invitedUser.id,
        channel: this.buildChannelDto(channel, membership, members)
      }
    }
  }

  private async revokeMembership(requester: ChannelMembership, nickName: string): Promise<CommandResultDto> {
    const channel = requester.channel!

    if (channel.type !== 'private') {
      throw new Exception('Revoke is available only in private channels', 400)
    }

    if (requester.role !== 'owner') {
      throw new Exception('Only owner can revoke invitations', 403)
    }

    const user = await User.query().where('nick_name', nickName).first()

    if (!user) {
      throw new Exception('User not found', 404)
    }

    const membership = await ChannelMembership.query()
      .where('channelId', channel.id)
      .andWhere('userId', user.id)
      .first()

    if (!membership) {
      throw new Exception('User is not a member of the channel', 404)
    }

    await membership.delete()

    const members = await this.channelMembers(channel)

    return {
      success: true,
      feedback: `${nickName} removed from #${channel.name}.`,
      channel: this.buildChannelDto(channel, requester, members)
    }
  }

  private async kickMember(requester: ChannelMembership, nickName: string): Promise<CommandResultDto> {
    const channel = requester.channel!

    const target = await User.query().where('nick_name', nickName).first()

    if (!target) {
      throw new Exception('User not found', 404)
    }

    if (target.id === requester.userId) {
      throw new Exception('Cannot kick yourself', 400)
    }

    const membership = await ChannelMembership.query()
      .where('channelId', channel.id)
      .andWhere('userId', target.id)
      .first()

    if (!membership) {
      throw new Exception('User is not in this channel', 404)
    }

    if (membership.role === 'owner') {
      throw new Exception('Cannot kick the owner', 403)
    }

    if (requester.role === 'owner') {
      await membership.delete()
      await ChannelBan.updateOrCreate(
        { channelId: channel.id, userId: target.id },
        { channelId: channel.id, userId: target.id, createdBy: requester.userId, permanent: true }
      )

      const members = await this.channelMembers(channel)

      return {
        success: true,
        feedback: `${nickName} was removed permanently by the owner.`,
        channel: this.buildChannelDto(channel, requester, members)
      }
    }

    if (channel.type !== 'public') {
      throw new Exception('Only owner can kick in private channels', 403)
    }

    await ChannelKickVote.updateOrCreate(
      {
        channelId: channel.id,
        targetUserId: target.id,
        voterUserId: requester.userId
      },
      {
        channelId: channel.id,
        targetUserId: target.id,
        voterUserId: requester.userId
      }
    )

    const voteCount = await ChannelKickVote.query()
      .where('channelId', channel.id)
      .andWhere('targetUserId', target.id)
      .count('* as total')

    const totalVotesRaw = voteCount[0]?.$extras.total ?? voteCount[0]?.$extras.count
    const totalVotes = typeof totalVotesRaw === 'string' ? parseInt(totalVotesRaw, 10) : (totalVotesRaw ?? 0)

    if (totalVotes >= KICK_VOTE_THRESHOLD) {
      await membership.delete()
      await ChannelBan.updateOrCreate(
        { channelId: channel.id, userId: target.id },
        { channelId: channel.id, userId: target.id, createdBy: requester.userId, permanent: true }
      )

      await ChannelKickVote.query()
        .where('channelId', channel.id)
        .andWhere('targetUserId', target.id)
        .delete()

      const members = await this.channelMembers(channel)

      return {
        success: true,
        feedback: `${nickName} was permanently removed after ${totalVotes} votes.`,
        channel: this.buildChannelDto(channel, requester, members)
      }
    }

    return {
      success: true,
      feedback: `Kick vote recorded (${totalVotes}/${KICK_VOTE_THRESHOLD}).`,
      channel: this.buildChannelDto(channel, requester, await this.channelMembers(channel))
    }
  }

  private async quitChannel(requester: ChannelMembership): Promise<CommandResultDto> {
    if (requester.role !== 'owner') {
      throw new Exception('Only the owner can close the channel', 403)
    }

    const channel = requester.channel!
    await Channel.query().where('id', channel.id).delete()

    return {
      success: true,
      feedback: `Channel #${channel.name} closed.`
    }
  }

  private async cancelMembership(requester: ChannelMembership): Promise<CommandResultDto> {
    const channel = requester.channel!

    if (requester.role === 'owner') {
      await Channel.query().where('id', channel.id).delete()
      return {
        success: true,
        feedback: `You left and channel #${channel.name} was deleted because you are the owner.`
      }
    }

    await requester.delete()

    return {
      success: true,
      feedback: `You left #${channel.name}.`
    }
  }

  private async listMembers(requester: ChannelMembership): Promise<CommandResultDto> {
    const members = await this.channelMembers(requester.channel!)

    return {
      success: true,
      feedback: `${members.length} members in #${requester.channel!.name}.`,
      members
    }
  }

  private async updateStatus(user: User, rawStatus: string): Promise<CommandResultDto> {
    const status = rawStatus.toLowerCase()

    if (!['online', 'dnd', 'offline'].includes(status)) {
      throw new Exception('Unsupported status', 422)
    }

    user.status = status as User['status']
    await user.save()

    await user.load('preference')

    return {
      success: true,
      feedback: `Status set to ${status}.`
    }
  }

  private async updateNotificationPreference(user: User, mode: string): Promise<CommandResultDto> {
    const normalized = mode.toLowerCase()

    const mentionsOnly = normalized === 'mentions' || normalized === 'mentions-only'

    let preference = await UserPreference.findBy('userId', user.id)

    if (!preference) {
      preference = await UserPreference.create({
        userId: user.id,
        mentionsOnlyNotifications: mentionsOnly
      })
    } else {
      preference.mentionsOnlyNotifications = mentionsOnly
      await preference.save()
    }

    return {
      success: true,
      feedback: mentionsOnly ? 'Notifications limited to mentions.' : 'Notifications enabled for all messages.'
    }
  }

  public async handleCommand(userId: string, rawCommand: string, contextChannelId?: string): Promise<CommandResultDto> {
    const user = await this.ensureUser(userId)

    const trimmed = rawCommand.trim()

    if (!trimmed.startsWith('/')) {
      throw new Exception('Invalid command syntax', 400)
    }

    const tokens = trimmed.slice(1).split(/\s+/)
    const command = tokens[0]?.toLowerCase()
    const args = tokens.slice(1)

    switch (command) {
      case 'join': {
        const channelName = args[0]
        const isPrivate = args[1]?.toLowerCase() === 'private'
        if (!channelName) {
          throw new Exception('Channel name missing', 422)
        }
        return this.joinChannel(user, channelName, isPrivate)
      }
      case 'invite': {
        if (!contextChannelId) {
          throw new Exception('Active channel required for /invite', 400)
        }
        const nickName = args[0]
        if (!nickName) {
          throw new Exception('Nickname missing', 422)
        }
        const membership = await this.ensureMembership(contextChannelId, user.id)
        await membership.load('channel')
        return this.inviteUser(membership, nickName)
      }
      case 'revoke': {
        if (!contextChannelId) {
          throw new Exception('Active channel required for /revoke', 400)
        }
        const nickName = args[0]
        if (!nickName) {
          throw new Exception('Nickname missing', 422)
        }
        const membership = await this.ensureMembership(contextChannelId, user.id)
        await membership.load('channel')
        return this.revokeMembership(membership, nickName)
      }
      case 'kick': {
        if (!contextChannelId) {
          throw new Exception('Active channel required for /kick', 400)
        }
        const nickName = args[0]
        if (!nickName) {
          throw new Exception('Nickname missing', 422)
        }
        const membership = await this.ensureMembership(contextChannelId, user.id)
        await membership.load('channel')
        return this.kickMember(membership, nickName)
      }
      case 'quit': {
        if (!contextChannelId) {
          throw new Exception('Active channel required for /quit', 400)
        }
        const membership = await this.ensureMembership(contextChannelId, user.id)
        await membership.load('channel')
        return this.quitChannel(membership)
      }
      case 'cancel': {
        if (!contextChannelId) {
          throw new Exception('Active channel required for /cancel', 400)
        }
        const membership = await this.ensureMembership(contextChannelId, user.id)
        await membership.load('channel')
        return this.cancelMembership(membership)
      }
      case 'list': {
        if (!contextChannelId) {
          throw new Exception('Active channel required for /list', 400)
        }
        const membership = await this.ensureMembership(contextChannelId, user.id)
        await membership.load('channel')
        return this.listMembers(membership)
      }
      case 'status': {
        const status = args[0]
        if (!status) {
          throw new Exception('Status value missing', 422)
        }
        return this.updateStatus(user, status)
      }
      case 'notify': {
        const preference = args[0]
        if (!preference) {
          throw new Exception('Notification mode missing', 422)
        }
        return this.updateNotificationPreference(user, preference)
      }
      case 'help':
        return {
          success: true,
          feedback: 'Commands: /join, /invite, /revoke, /kick, /quit, /cancel, /list, /status, /notify.'
        }
      default:
        throw new Exception(`Unknown command: ${command}`, 400)
    }
  }

  private extractAddressedUser(content: string, members: ChannelMemberDto[]): ChannelMemberDto | null {
    const mentionMatch = content.match(/@([a-zA-Z0-9._-]+)/)

    if (!mentionMatch) {
      return null
    }

    const nickname = mentionMatch[1]
    return members.find((member) => member.nickName === nickname) ?? null
  }

  private async ensureNotBanned(channelId: string, userId: string) {
    const ban = await ChannelBan.query()
      .where('channelId', channelId)
      .andWhere('userId', userId)
      .first()

    if (ban) {
      throw new Exception('You are banned from this channel', 403)
    }
  }

  public async sendMessage(userId: string, channelId: string, content: string): Promise<MessageDto> {
    if (!content.trim()) {
      throw new Exception('Empty messages are not allowed', 422)
    }

    await this.ensureNotBanned(channelId, userId)

    const membership = await this.ensureMembership(channelId, userId)

    if (membership.status !== 'active') {
      throw new Exception('You must accept the invitation before posting', 403)
    }

    const channel = await this.ensureChannel(channelId)

    await channel.load('memberships', (builder: ModelQueryBuilderContract<typeof ChannelMembership>) => {
      builder.where('status', 'active').preload('user', (userBuilder: ModelQueryBuilderContract<typeof User>) => {
        userBuilder.preload('preference', (prefBuilder) => prefBuilder.limit(1))
      })
    })

    const members = this.mapMembers(channel.memberships)
    const addressedMember = this.extractAddressedUser(content, members)

    const message = await Message.create({
      channelId,
      senderId: userId,
      content,
      addressedTo: addressedMember?.id ?? null
    })

    channel.lastActivityAt = DateTime.utc()
    await channel.save()

    membership.lastReadAt = DateTime.utc()
    await membership.save()

    const highlightExpiry = DateTime.utc().plus({ hours: 1 })

    for (const member of channel.memberships) {
      if (member.userId === userId) {
        continue
      }

      if (addressedMember && member.userId === addressedMember.id) {
        member.highlightUntil = highlightExpiry
        await member.save()
        continue
      }

      const memberUser = member.$preloaded.user as User
      const memberPreference = memberUser.$preloaded.preference as UserPreference | undefined
      const notifyMentionsOnly = memberPreference?.mentionsOnlyNotifications ?? false

      if (!notifyMentionsOnly) {
        member.highlightUntil = highlightExpiry
        await member.save()
      }
    }

    const senderMembership = channel.memberships.find((m) => m.userId === userId)
    const sender = (senderMembership?.$preloaded.user as User | undefined) ?? await this.ensureUser(userId)
    const addressedUserModel = addressedMember
      ? (channel.memberships.find((m) => m.userId === addressedMember.id)?.$preloaded.user as User | undefined)
      : null

    return message.toDto(sender, addressedUserModel ?? null)
  }

  public async fetchMessages(userId: string, channelId: string, cursor?: string, limit = 30) {
    await this.ensureMembership(channelId, userId)

    const query = Message.query()
      .where('channelId', channelId)
      .orderBy('createdAt', 'desc')
      .preload('sender')

    if (cursor) {
      query.where('createdAt', '<', DateTime.fromISO(cursor).toSQL())
    }

    query.limit(limit + 1)

    const records = await query
    const hasMore = records.length > limit
    const sliced = hasMore ? records.slice(0, limit) : records
    const messages = await Promise.all(
      sliced.map(async (record) => {
        const addressedUser = record.addressedTo ? await User.find(record.addressedTo) : null
        return record.toDto(record.$preloaded.sender! as User, addressedUser)
      })
    )

    return {
      messages: messages.reverse(),
      nextCursor: hasMore ? sliced[sliced.length - 1].createdAt.toISO() : null
    }
  }

  public async updateTypingState(userId: string, channelId: string, content: string) {
    await this.ensureMembership(channelId, userId)

    const trimmed = content.trim()

    if (!trimmed) {
      await ChannelDraft.query().where('channelId', channelId).andWhere('userId', userId).delete()
      return
    }

    await ChannelDraft.updateOrCreate(
      { channelId, userId },
      { channelId, userId, content: trimmed }
    )
  }

  public async getTypingStates(userId: string, channelId: string): Promise<TypingStateDto[]> {
    await this.ensureMembership(channelId, userId)

    const drafts = await ChannelDraft.query()
      .where('channelId', channelId)
      .andWhereNot('userId', userId)
      .preload('user')

    return drafts.map((draft) => ({
      userId: draft.userId,
      nickName: (draft.$preloaded.user as User).nickName,
      contentPreview: draft.content.slice(0, 120),
      updatedAt: draft.updatedAt.toISO()
    }))
  }
}

export default new ChatService()
