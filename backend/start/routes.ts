/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes.
|
*/

import Route from '@ioc:Adonis/Core/Route'
Route.get('/', () => ({ status: 'ok' }))

Route.group(() => {
  Route.get('/users', 'UsersController.index')
  Route.get('/users/:id', 'UsersController.show')

  Route.post('/auth/register', 'AuthController.register')
  Route.post('/auth/login', 'AuthController.login')

  Route.get('/channels', 'ChannelsController.index')
  Route.get('/channels/:id/members', 'ChannelsController.members')
  Route.post('/channels/:id/leave', 'ChannelsController.leave')
  Route.post('/channels/:id/typing', 'ChannelsController.updateTyping')
  Route.get('/channels/:id/typing', 'ChannelsController.typing')

  Route.get('/channels/:id/messages', 'MessagesController.index')
  Route.post('/channels/:id/messages', 'MessagesController.store')

  Route.post('/commands', 'CommandsController.handle')
}).prefix('/api')
