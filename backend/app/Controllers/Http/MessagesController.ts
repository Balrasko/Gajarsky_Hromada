import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

import ChatService from 'App/Services/ChatService'

export default class MessagesController {
  public async index({ request, params }: HttpContextContract) {
    const querySchema = schema.create({
      userId: schema.string({}, [rules.uuid()]),
      cursor: schema.string.optional({ trim: true }),
      limit: schema.number.optional([rules.range(1, 100)])
    })

    const { userId, cursor, limit } = await request.validate({ schema: querySchema })
    const channelId = params.id as string

    const { messages, nextCursor } = await ChatService.fetchMessages(userId, channelId, cursor, limit)

    return { messages, nextCursor }
  }

  public async store({ request, params }: HttpContextContract) {
    const bodySchema = schema.create({
      userId: schema.string({}, [rules.uuid()]),
      content: schema.string()
    })

    const { userId, content } = await request.validate({ schema: bodySchema })
    const channelId = params.id as string

    const message = await ChatService.sendMessage(userId, channelId, content)

    return { message }
  }
}
