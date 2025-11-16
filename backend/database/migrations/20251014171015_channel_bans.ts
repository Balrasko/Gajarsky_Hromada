import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChannelBansSchema extends BaseSchema {
  protected tableName = 'channel_bans'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('channel_id').notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.boolean('permanent').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.unique(['channel_id', 'user_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
