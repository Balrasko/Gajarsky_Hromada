import { randomUUID } from 'crypto'

import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  BelongsTo
} from '@ioc:Adonis/Lucid/Orm'

import type { MessageDto } from '@vpwa/shared'

import Channel from './Channel'
import User from './User'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column({ columnName: 'sender_id' })
  public senderId: string

  @column()
  public content: string

  @column({ columnName: 'addressed_to' })
  public addressedTo: string | null

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => Channel)
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'senderId' })
  public sender: BelongsTo<typeof User>

  public toDto(author: User, addressedUser?: User | null): MessageDto {
    return {
      id: this.id,
      channelId: this.channelId,
      sender: author.nickName,
      senderId: author.id,
      content: this.content,
      createdAt: this.createdAt.toISO(),
      addressedTo: addressedUser?.nickName ?? undefined
    }
  }

  @beforeCreate()
  public static assignUuid(message: Message) {
    message.id = randomUUID()
  }
}
