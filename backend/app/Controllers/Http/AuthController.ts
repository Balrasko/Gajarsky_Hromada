import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Hash from '@ioc:Adonis/Core/Hash'
import { rules, schema } from '@ioc:Adonis/Core/Validator'

import User from 'App/Models/User'

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

    const user = await User.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      nickName: payload.nickName,
      email: payload.email,
      password: await Hash.make(payload.password),
      status: 'offline'
    })

    return response.created({ user: user.toDto() })
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

    return { user: user.toDto() }
  }
}
