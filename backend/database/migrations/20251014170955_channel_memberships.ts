import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChannelMembershipsSchema extends BaseSchema {
  protected tableName = 'channel_memberships'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('channel_id').notNullable().references('id').inTable('channels').onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .enu('role', ['owner', 'member'], {
          useNative: true,
          enumName: 'channel_member_role'
        })
        .notNullable()
        .defaultTo('member')
      table
        .enu('status', ['active', 'invited'], {
          useNative: true,
          enumName: 'channel_member_status'
        })
        .notNullable()
        .defaultTo('active')
      table.timestamp('joined_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('last_read_at', { useTz: true }).nullable()
      table.timestamp('highlight_until', { useTz: true }).nullable()
      table.unique(['channel_id', 'user_id'])
      table.index(['user_id'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS channel_member_role')
    this.schema.raw('DROP TYPE IF EXISTS channel_member_status')
  }
}
