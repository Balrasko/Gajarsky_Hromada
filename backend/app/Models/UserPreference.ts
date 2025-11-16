import { randomUUID } from 'crypto'

import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  BelongsTo
} from '@ioc:Adonis/Lucid/Orm'

import User from './User'

export default class UserPreference extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'user_id' })
  public userId: string

  @column({ columnName: 'mentions_only_notifications' })
  public mentionsOnlyNotifications: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @beforeCreate()
  public static assignUuid(preference: UserPreference) {
    preference.id = randomUUID()
  }
}
