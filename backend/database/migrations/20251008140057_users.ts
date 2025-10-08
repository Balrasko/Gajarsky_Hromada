import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UsersSchema extends BaseSchema {
  protected tableName = 'users'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('nick_name').notNullable().unique()
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table
        .enu('status', ['online', 'dnd', 'offline'], {
          useNative: true,
          enumName: 'user_status'
        })
        .notNullable()
        .defaultTo('offline')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS user_status')
  }
}
