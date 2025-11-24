import { boot } from 'quasar/wrappers'

import socket from 'src/services/socket'

export default boot(({ app }) => {
  app.config.globalProperties.$socket = socket
})

declare module 'vue' {
  interface ComponentCustomProperties {
    $socket: typeof socket;
  }
}
