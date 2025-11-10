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

export default class ChannelMembership extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column({ columnName: 'user_id' })
  public userId: string

  @column()
  public role: 'owner' | 'member'

  @column()
  public status: 'active' | 'invited'

  @column.dateTime({ columnName: 'joined_at' })
  public joinedAt: DateTime

  @column.dateTime({ columnName: 'last_read_at' })
  public lastReadAt: DateTime | null

  @column.dateTime({ columnName: 'highlight_until' })
  public highlightUntil: DateTime | null

  public unreadCount = 0

  @belongsTo(() => Channel)
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @beforeCreate()
  public static assignUuid(membership: ChannelMembership) {
    membership.id = randomUUID()
  }
}
