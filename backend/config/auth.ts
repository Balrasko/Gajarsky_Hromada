import { AuthConfig } from '@ioc:Adonis/Addons/Auth'

const authConfig: AuthConfig = {
  guard: 'api',
  guards: {
    api: {
      driver: 'oat', // opaque access token
      tokenProvider: {
        type: 'api',
        driver: 'database',
        table: 'api_tokens',
      },
      provider: {
        driver: 'lucid',
        identifierKey: 'email',
        uids: ['email'],
        model: () => import('App/Models/User'),
      },
    },
  },
}

export default authConfig
