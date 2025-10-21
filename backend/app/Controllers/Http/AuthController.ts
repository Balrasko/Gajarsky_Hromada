import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Hash from '@ioc:Adonis/Core/Hash'
import { rules, schema } from '@ioc:Adonis/Core/Validator'

import Database from '@ioc:Adonis/Lucid/Database'

import User from 'App/Models/User'
import UserPreference from 'App/Models/UserPreference'

export default class AuthController {
  public async register({ request, response }: HttpContextContract) {
    const registerSchema = schema.create({
      firstName: schema.string({ trim: true }, [rules.maxLength(120)]),
      lastName: schema.string({ trim: true }, [rules.maxLength(120)]),
      nickName: schema.string({ trim: true }, [
        rules.unique({ table: 'users', column: 'nick_name' }),
        rules.maxLength(60)
      ]),
      email: schema.string({ trim: true }, [rules.email(), rules.unique({ table: 'users', column: 'email' })]),
      password: schema.string({}, [rules.minLength(6)]),
    })

    const payload = await request.validate({ schema: registerSchema })

    const trx = await Database.transaction()

    try {
      const user = await User.create({
        firstName: payload.firstName,
        lastName: payload.lastName,
        nickName: payload.nickName,
        email: payload.email,
        password: await Hash.make(payload.password),
        status: 'offline'
      }, { client: trx })

      await UserPreference.create({
        userId: user.id,
        mentionsOnlyNotifications: false
      }, { client: trx })

      await trx.commit()

      await user.load('preference')

      return response.created({ user: user.toDto() })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  public async login({ request, response }: HttpContextContract) {
    const loginSchema = schema.create({
      email: schema.string({ trim: true }, [rules.email()]),
      password: schema.string()
    })

    const payload = await request.validate({ schema: loginSchema })

    const user = await User.query().where('email', payload.email).first()

    if (!user) {
      return response.unauthorized({ message: 'Invalid credentials' })
    }

    const isValid = await Hash.verify(user.password, payload.password)

    if (!isValid) {
      return response.unauthorized({ message: 'Invalid credentials' })
    }

    // For now we simply mark the user online when they log in successfully.
    user.status = 'online'
    await user.save()

    await user.load('preference')

    return { user: user.toDto() }
  }

  public async logout({ request, response }: HttpContextContract) {
    const logoutSchema = schema.create({
      userId: schema.string({}, [rules.uuid()])
    })

    const payload = await request.validate({ schema: logoutSchema })

    const user = await User.find(payload.userId)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    user.status = 'offline'
    await user.save()

    await user.load('preference')

    return { user: user.toDto() }
  }
}
