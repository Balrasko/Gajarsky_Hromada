import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

import ChatService from 'App/Services/ChatService'

export default class ChannelsController {
  public async index({ request }: HttpContextContract) {
    const querySchema = schema.create({
      userId: schema.string({}, [rules.uuid()])
    })

    const { userId } = await request.validate({ schema: querySchema })

    const { channels, invites } = await ChatService.getUserChannelCollections(userId)

    return { channels, invites }
  }

  public async members({ request, params }: HttpContextContract) {
    const querySchema = schema.create({
      userId: schema.string({}, [rules.uuid()])
    })

    const { userId } = await request.validate({ schema: querySchema })
    const channelId = params.id as string

    const result = await ChatService.handleCommand(userId, '/list', channelId)

    return {
      members: result.members ?? [],
      feedback: result.feedback
    }
  }

  public async leave({ request, params }: HttpContextContract) {
    const bodySchema = schema.create({
      userId: schema.string({}, [rules.uuid()])
    })

    const { userId } = await request.validate({ schema: bodySchema })
    const channelId = params.id as string

    const result = await ChatService.handleCommand(userId, '/cancel', channelId)

    return {
      feedback: result.feedback
    }
  }

  public async updateTyping({ request, params }: HttpContextContract) {
    const bodySchema = schema.create({
      userId: schema.string({}, [rules.uuid()]),
      content: schema.string.optional({ trim: true }, [rules.maxLength(5000)])
    })

    const { userId, content } = await request.validate({ schema: bodySchema })
    const channelId = params.id as string

    await ChatService.updateTypingState(userId, channelId, content ?? '')

    return {
      updatedAt: DateTime.utc().toISO()
    }
  }

  public async typing({ request, params }: HttpContextContract) {
    const querySchema = schema.create({
      userId: schema.string({}, [rules.uuid()])
    })

    const { userId } = await request.validate({ schema: querySchema })
    const channelId = params.id as string

    const typing = await ChatService.getTypingStates(userId, channelId)

    return { typing }
  }
}
