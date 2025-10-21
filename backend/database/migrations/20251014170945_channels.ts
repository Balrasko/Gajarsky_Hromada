import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChannelsSchema extends BaseSchema {
  protected tableName = 'channels'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('name').notNullable().unique()
      table
        .enu('type', ['public', 'private'], {
          useNative: true,
          enumName: 'channel_type'
        })
        .notNullable()
      table.uuid('owner_id').references('id').inTable('users').onDelete('CASCADE')
      table.boolean('is_archived').notNullable().defaultTo(false)
      table.timestamp('last_activity_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS channel_type')
  }
}
