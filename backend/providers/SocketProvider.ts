import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { Server as IOServer } from 'socket.io'

export default class SocketProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {}

  public async boot() {
    const HttpServer = this.app.container.use('Adonis/Core/Server')

    // počkáme, kým Adonis dokončí inicializáciu
    setImmediate(() => {
      const serverInstance = HttpServer.instance
      if (!serverInstance) {
        console.error('Adonis HTTP server not ready')
        return
      }

      const io = new IOServer(serverInstance, {
        cors: { origin: '*' },
      })

      console.log('Socket.IO started')

      io.on('connection', (socket) => {
        console.log('Connected:', socket.id)
        socket.on('ping', () => socket.emit('pong'))
      })

      // zaregistrujeme io do IoC kontajnera
      this.app.container.bind('App/Socket', () => io)
    })
  }
}
