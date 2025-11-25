declare module '@ioc:App/Socket' {
  import type { Server as IOServer } from 'socket.io'
  const io: IOServer
  export default io
}
