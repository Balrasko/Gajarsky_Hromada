import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

export default class UsersController {
  public async index({}: HttpContextContract) {
    const users = await User.query().orderBy('created_at', 'desc')
    return { users: users.map((user) => user.toDto()) }
  }

  public async show({ params, response }: HttpContextContract) {
    const user = await User.find(params.id)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    return { user: user.toDto() }
  }
}
