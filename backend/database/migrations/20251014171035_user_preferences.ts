import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UserPreferencesSchema extends BaseSchema {
  protected tableName = 'user_preferences'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE')
      table.boolean('mentions_only_notifications').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
