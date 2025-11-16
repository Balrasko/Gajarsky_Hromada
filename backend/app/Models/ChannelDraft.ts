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

export default class ChannelDraft extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column({ columnName: 'user_id' })
  public userId: string

  @column()
  public content: string

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Channel)
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @beforeCreate()
  public static assignUuid(draft: ChannelDraft) {
    draft.id = randomUUID()
  }
}
