import { randomUUID } from 'crypto'

import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
  HasMany,
  BelongsTo
} from '@ioc:Adonis/Lucid/Orm'

import User from './User'
import ChannelMembership from './ChannelMembership'
import Message from './Message'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column()
  public type: 'public' | 'private'

  @column({ columnName: 'owner_id' })
  public ownerId: string

  @column({ columnName: 'is_archived' })
  public isArchived: boolean

  @column.dateTime({ columnName: 'last_activity_at' })
  public lastActivityAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'ownerId'
  })
  public owner: BelongsTo<typeof User>

  @hasMany(() => ChannelMembership)
  public memberships: HasMany<typeof ChannelMembership>

  @hasMany(() => Message)
  public messages: HasMany<typeof Message>

  @beforeCreate()
  public static assignUuid(channel: Channel) {
    channel.id = randomUUID()
  }
}
