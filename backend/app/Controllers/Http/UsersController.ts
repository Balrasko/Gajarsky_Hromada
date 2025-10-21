import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

export default class UsersController {
  public async index({}: HttpContextContract) {
    const users = await User.query().orderBy('created_at', 'desc').preload('preference')
    return { users: users.map((user) => user.toDto()) }
  }

  public async show({ params, response }: HttpContextContract) {
    const user = await User.query().where('id', params.id).preload('preference').first()

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    return { user: user.toDto() }
  }
}
