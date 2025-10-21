import { randomUUID } from 'crypto'

import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  BelongsTo
} from '@ioc:Adonis/Lucid/Orm'

import Channel from './Channel'
import User from './User'

export default class ChannelBan extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column({ columnName: 'user_id' })
  public userId: string

  @column({ columnName: 'created_by' })
  public createdBy: string

  @column()
  public permanent: boolean

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => Channel)
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @beforeCreate()
  public static assignUuid(ban: ChannelBan) {
    ban.id = randomUUID()
  }
}
