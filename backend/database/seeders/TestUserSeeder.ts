import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'

export default class TestUserSeeder extends BaseSeeder {
  public async run () {
    await User.updateOrCreate(
      { email: 'pokus@gmail.com' },
      {
        firstName: 'pokus',
        lastName: 'pokus',
        nickname: 'pokus',
        email: 'pokus@gmail.com',
        passwordHash: 'pokus',
        status: 'offline',
      }
    )
  }
}
