import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import User from 'App/Models/User'

export default class AuthController {
  public async register({ request, response, auth }: HttpContextContract) {
    const data = request.only(['first_name', 'last_name', 'nickname', 'email', 'password'])

    try {
      const user = await User.create({
        firstName: data.first_name,
        lastName: data.last_name,
        nickname: data.nickname,
        email: data.email,
        passwordHash: data.password,
      })

      const token = await auth.use('api').login(user)
      return response.created({ user, token })
    } catch (error) {
      Logger.error({ err: error }, 'Failed to register user')
      return response.internalServerError({ message: 'Registration failed', details: error.message })
    }
  }

  public async login({ request, auth, response }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const token = await auth.use('api').attempt(email, password)
      return { token }
    } catch (error) {
      Logger.warn({ err: error }, 'Invalid login attempt')
      return response.unauthorized('Invalid credentials')
    }
  }

  public async logout({ auth, response }: HttpContextContract) {
    await auth.use('api').logout()
    return response.ok({ message: 'Logged out' })
  }
}
