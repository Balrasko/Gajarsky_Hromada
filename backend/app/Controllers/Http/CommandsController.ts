import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

import ChatService from 'App/Services/ChatService'

export default class CommandsController {
  public async handle({ request }: HttpContextContract) {
    const payloadSchema = schema.create({
      userId: schema.string({}, [rules.uuid()]),
      command: schema.string({ trim: true }),
      channelId: schema.string.optional({}, [rules.uuid()])
    })

    const payload = await request.validate({ schema: payloadSchema })

    const result = await ChatService.handleCommand(payload.userId, payload.command, payload.channelId ?? undefined)

    return { result }
  }
}
