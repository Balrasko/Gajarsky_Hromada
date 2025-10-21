import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChannelDraftsSchema extends BaseSchema {
  protected tableName = 'channel_drafts'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('channel_id').notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.text('content').notNullable()
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.unique(['channel_id', 'user_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
