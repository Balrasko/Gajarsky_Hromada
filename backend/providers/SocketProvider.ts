import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { DateTime } from 'luxon'
import { Server as IOServer, type Socket } from 'socket.io'
import { Exception } from '@adonisjs/core/build/standalone'
import type { HashContract } from '@ioc:Adonis/Core/Hash'

import type ChatServiceType from 'App/Services/ChatService'
import type UserModel from 'App/Models/User'
import type ChannelMembershipModel from 'App/Models/ChannelMembership'

type Ack<T> = (response: { ok: true; data: T } | { ok: false; message?: string; status?: number }) => void

export default class SocketProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {}

  private validatorModule!: typeof import('@ioc:Adonis/Core/Validator')
  private hash!: HashContract
  private ChatService!: ChatServiceType
  private User!: typeof UserModel
  private ChannelMembership!: typeof ChannelMembershipModel

  private respond<T>(
    socket: Socket,
    event: string,
    handler: (payload: Record<string, any>) => Promise<T>
  ) {
    socket.on(event, async (payload: Record<string, any> = {}, ack?: Ack<T>) => {
      const reply: Ack<T> = typeof ack === 'function' ? ack : () => {}

      try {
        const data = await handler(payload ?? {})
        reply({ ok: true, data })
      } catch (error) {
        const status = typeof (error as any)?.status === 'number' ? (error as any).status : undefined
        const validationErrors =
          ((error as any)?.messages?.errors as { message?: string }[] | undefined) ??
          (Array.isArray((error as any)?.messages) ? ((error as any)?.messages as { message?: string }[]) : undefined)

        const message =
          (validationErrors && validationErrors.length
            ? validationErrors
                .map((item) => item?.message)
                .filter(Boolean)
                .join('; ')
            : undefined) ||
          (error as Error)?.message ||
          'Unexpected error'
        console.error(`[socket:${event}]`, error)
        reply({ ok: false, message, status })
      }
    })
  }

  private async markUserStatus(userId: string, status: User['status']) {
    const user = await this.User.find(userId)
    if (!user) {
      return
    }

    user.status = status
    await user.save()
  }

  private registerHandlers(io: IOServer, socket: Socket) {
    this.respond(socket, 'auth:register', async (payload) => {
      const { schema, rules, validator } = this.validatorModule

      const registerSchema = schema.create({
        firstName: schema.string({ trim: true }, [rules.maxLength(120)]),
        lastName: schema.string({ trim: true }, [rules.maxLength(120)]),
        nickName: schema.string({ trim: true }, [
          rules.unique({ table: 'users', column: 'nick_name' }),
          rules.maxLength(60)
        ]),
        email: schema.string({ trim: true }, [rules.email(), rules.unique({ table: 'users', column: 'email' })]),
        password: schema.string({}, [rules.minLength(6)])
      })

      const payloadData = await validator.validate({ schema: registerSchema, data: payload })

      const user = await this.User.create({
        firstName: payloadData.firstName,
        lastName: payloadData.lastName,
        nickName: payloadData.nickName,
        email: payloadData.email,
        password: await this.hash.make(payloadData.password),
        status: 'offline'
      })

      return { user: user.toDto() }
    })

    this.respond(socket, 'auth:login', async (payload) => {
      const { schema, rules, validator } = this.validatorModule

      const loginSchema = schema.create({
        email: schema.string({ trim: true }, [rules.email()]),
        password: schema.string()
      })

      const payloadData = await validator.validate({ schema: loginSchema, data: payload })

      const user = await this.User.query().where('email', payloadData.email).first()

      if (!user) {
        throw new Error('Invalid credentials')
      }

      const isValid = await this.hash.verify(user.password, payloadData.password)

      if (!isValid) {
        throw new Error('Invalid credentials')
      }

      user.status = 'online'
      await user.save()

      socket.data.userId = user.id

      return { user: user.toDto() }
    })

    this.respond(socket, 'users:list', async () => {
      const users = await this.User.query().orderBy('created_at', 'desc')
      return { users: users.map((u) => u.toDto()) }
    })

    this.respond(socket, 'channels:list', async (payload) => {
      const { userId } = payload
      const channels = await this.ChatService.getUserChannels(userId)
      return { channels }
    })

    this.respond(socket, 'channels:members', async (payload) => {
      const { channelId, userId } = payload
      const result = await this.ChatService.handleCommand(userId, '/list', channelId)

      return {
        members: result.members ?? [],
        feedback: result.feedback
      }
    })

    this.respond(socket, 'channels:leave', async (payload) => {
      const { channelId, userId } = payload
      const result = await this.ChatService.handleCommand(userId, '/cancel', channelId)
      return { feedback: result.feedback }
    })

    this.respond(socket, 'channels:typing:update', async (payload) => {
      const { channelId, userId, content } = payload
      await this.ChatService.updateTypingState(userId, channelId, content ?? '')
      return { updatedAt: DateTime.utc().toISO() }
    })

    this.respond(socket, 'channels:typing:list', async (payload) => {
      const { channelId, userId } = payload
      const typing = await this.ChatService.getTypingStates(userId, channelId)
      return { typing }
    })

    this.respond(socket, 'channels:messages', async (payload) => {
      const { channelId, userId, cursor, limit } = payload
      return this.ChatService.fetchMessages(userId, channelId, cursor, limit)
    })

    this.respond(socket, 'channels:message:send', async (payload) => {
      const { channelId, userId, content } = payload
      const message = await this.ChatService.sendMessage(userId, channelId, content)

      io.to(channelId).emit('channels:message:new', { message })

      return { message }
    })

    this.respond(socket, 'commands:execute', async (payload) => {
      const { userId, command, channelId } = payload
      const result = await this.ChatService.handleCommand(userId, command, channelId ?? undefined)
      return { result }
    })

    this.respond(socket, 'channels:subscribe', async (payload) => {
      const { channelId, userId } = payload

      const authenticatedUserId = (socket.data.userId as string | undefined) ?? userId
      if (!authenticatedUserId) {
        throw new Exception('User not authenticated', 401)
      }

      const membership = await this.ChannelMembership.query()
        .where('channelId', channelId)
        .andWhere('userId', authenticatedUserId)
        .andWhere('status', 'active')
        .first()

      if (!membership) {
        throw new Exception('Not a channel member', 403)
      }

      socket.data.userId = authenticatedUserId
      socket.join(channelId)
      return { joined: true }
    })
  }

  public async boot() {
    const HttpServer = this.app.container.use('Adonis/Core/Server')

    setImmediate(() => {
      const serverInstance = HttpServer.instance
      if (!serverInstance) {
        console.error('Adonis HTTP server not ready')
        return
      }

      const resolveBinding = <T>(binding: string): T => {
        const mod = this.app.container.use(binding) as any
        return (mod?.default as T) ?? (mod as T)
      }

      this.validatorModule = this.app.container.use('Adonis/Core/Validator')
      this.hash = this.app.container.use('Adonis/Core/Hash')
      this.ChatService = resolveBinding<ChatServiceType>('App/Services/ChatService')
      this.User = resolveBinding<typeof UserModel>('App/Models/User')
      this.ChannelMembership = resolveBinding<typeof ChannelMembershipModel>('App/Models/ChannelMembership')

      const io = new IOServer(serverInstance, {
        cors: { origin: '*' }
      })

      this.app.container.bind('App/Socket', () => io)

      io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id)

        this.registerHandlers(io, socket)

        socket.on('disconnect', async () => {
          const userId = socket.data.userId as string | undefined
          if (userId) {
            await this.markUserStatus(userId, 'offline')
          }
        })
      })

      console.log('Socket.IO started')
    })
  }
}
