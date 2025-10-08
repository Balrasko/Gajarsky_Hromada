import { randomUUID } from 'crypto'

import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@ioc:Adonis/Lucid/Orm'
import type { UserDto } from '@vpwa/shared'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'first_name' })
  public firstName: string

  @column({ columnName: 'last_name' })
  public lastName: string

  @column({ columnName: 'nick_name' })
  public nickName: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public status: UserDto['status']

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  public toDto(): UserDto {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      nickName: this.nickName,
      email: this.email,
      status: this.status
    }
  }

  @beforeCreate()
  public static assignUuid(user: User) {
    user.id = randomUUID()
  }
}
