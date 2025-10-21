import { randomUUID } from 'crypto'

import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  column,
  hasMany,
  HasMany,
  hasOne,
  HasOne
} from '@ioc:Adonis/Lucid/Orm'
import type { UserDto } from '@vpwa/shared'

import Channel from './Channel'
import ChannelMembership from './ChannelMembership'
import Message from './Message'
import UserPreference from './UserPreference'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'first_name' })
  public firstName: string

  @column({ columnName: 'last_name' })
  public lastName: string

  @column({ columnName: 'nick_name' })
  public nickName: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public status: UserDto['status']

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Channel, {
    foreignKey: 'ownerId'
  })
  public ownedChannels: HasMany<typeof Channel>

  @hasMany(() => ChannelMembership)
  public memberships: HasMany<typeof ChannelMembership>

  @hasMany(() => Message, {
    foreignKey: 'senderId'
  })
  public messages: HasMany<typeof Message>

  @hasOne(() => UserPreference)
  public preference: HasOne<typeof UserPreference>

  public toDto(): UserDto {
    const mentionsOnly = this.$preloaded.preference?.mentionsOnlyNotifications ?? false

    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      nickName: this.nickName,
      email: this.email,
      status: this.status,
      notifyMentionsOnly: mentionsOnly
    }
  }

  @beforeCreate()
  public static assignUuid(user: User) {
    user.id = randomUUID()
  }
}
