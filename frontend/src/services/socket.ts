import { io, type Socket } from 'socket.io-client'

type AckResponse<T> =
  | { ok: true; data: T }
  | { ok: false; message?: string; status?: number }

const socket: Socket = io('/', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  autoConnect: true
})

export const socketRequest = async <T>(event: string, payload?: unknown): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Socket timeout for event ${event}`))
    }, 10_000)

    socket.emit(event, payload ?? {}, (response: AckResponse<T> | undefined) => {
      window.clearTimeout(timer)
      if (!response) {
        reject(new Error(`No response from server for ${event}`))
        return
      }

      if (response.ok) {
        resolve(response.data)
      } else {
        reject(new Error(response.message || `Socket request failed (${event})`))
      }
    })
  })
}

socket.on('connect_error', (error) => {
  console.error('Socket connection error', error)
})

export default socket
