/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes.
|
*/

import Route from '@ioc:Adonis/Core/Route'
import type { UserDto } from '@vpwa/shared'

type HelloRouteResponse = {
  message: string
}

type ExampleUser = Pick<UserDto, 'id' | 'nickName'>

Route.get('/', () => ({ status: 'ok' }))

Route.get('/api/hello', () => {
  const exampleUser: ExampleUser = {
    id: 'example-user-id',
    nickName: 'example'
  }

  void exampleUser

  const response: HelloRouteResponse = { message: 'Hello World' }
  return response
})
