import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import Logger from '@ioc:Adonis/Core/Logger'
import type { DatabaseContract } from '@ioc:Adonis/Lucid/Database'

export default class AppProvider {
  constructor (protected app: ApplicationContract) {}

  public register () {
    // Register your own bindings
  }

  public async boot () {
    // IoC container is ready
  }

  public async ready () {
    try {
      const Database = this.app.container.use('Adonis/Lucid/Database') as DatabaseContract
      await Database.manager.connect('pg')
      Logger.debug('Database connection to pg established')
    } catch (error) {
      Logger.error({ error }, 'Failed to establish database connection')
      throw error
    }
  }

  public async shutdown () {
    const Database = this.app.container.use('Adonis/Lucid/Database') as DatabaseContract
    await Database.manager.closeAll()
  }
}
