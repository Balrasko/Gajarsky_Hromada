import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChannelKickVotesSchema extends BaseSchema {
  protected tableName = 'channel_kick_votes'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('channel_id').notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.uuid('target_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('voter_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.unique(['channel_id', 'target_user_id', 'voter_user_id'], 'channel_vote_unique')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
