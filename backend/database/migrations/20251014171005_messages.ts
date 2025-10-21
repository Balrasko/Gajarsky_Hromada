import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class MessagesSchema extends BaseSchema {
  protected tableName = 'messages'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('channel_id').notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.text('content').notNullable()
      table.uuid('addressed_to').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.index(['channel_id', 'created_at'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
