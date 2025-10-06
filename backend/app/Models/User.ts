import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { BaseModel, column, beforeSave } from '@ioc:Adonis/Lucid/Orm'

type UserStatus = 'online' | 'dnd' | 'offline'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'first_name' })
  public firstName: string

  @column({ columnName: 'last_name' })
  public lastName: string

  @column({ columnName: 'nickname' })
  public nickname: string

  @column({ columnName: 'email' })
  public email: string

  @column({ columnName: 'password_hash', serializeAs: null })
  public passwordHash: string

  @column({ columnName: 'status' })
  public status: UserStatus

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.passwordHash) {
      user.passwordHash = await Hash.make(user.passwordHash)
    }
  }
}
