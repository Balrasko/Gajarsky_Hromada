/**
 * Database configuration
 */

import Env from '@ioc:Adonis/Core/Env'
import type { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'

const databaseConfig: DatabaseConfig = {
  connection: Env.get('DB_CONNECTION', 'pg'),

  connections: {
    pg: {
      client: 'pg',
      connection: {
        host: Env.get('DB_HOST', '127.0.0.1'),
        port: Env.get('DB_PORT', 5432),
        user: Env.get('DB_USER', 'postgres'),
        password: Env.get('DB_PASSWORD', ''),
        database: Env.get('DB_NAME', 'postgres'),
      },
      migrations: {
        tableName: 'adonis_schema',
      },
      healthCheck: true,
      debug: Env.get('DB_DEBUG', false),
    },
  },
}

export default databaseConfig
