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

export default class ChannelKickVote extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column({ columnName: 'target_user_id' })
  public targetUserId: string

  @column({ columnName: 'voter_user_id' })
  public voterUserId: string

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => Channel)
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'targetUserId' })
  public targetUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'voterUserId' })
  public voterUser: BelongsTo<typeof User>

  @beforeCreate()
  public static assignUuid(vote: ChannelKickVote) {
    vote.id = randomUUID()
  }
}
