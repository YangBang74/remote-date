import { Server, Socket } from 'socket.io'
import { ChatMessage } from './chat.types'
import { chatService } from './chat.service'

export default function chatGateway(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Connected:', socket.id)

    socket.on('chat:send', async (msg: ChatMessage) => {
      await chatService.saveMessage(msg)
      io.to(msg.room).emit('chat:message', msg)
    })

    socket.on('join_room', (room: string) => {
      socket.join(room)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected:', socket.id)

      // Когда сокет отключается, проверяем его комнаты.
      // Если в комнате больше нет участников - очищаем историю чата.
      const rooms = socket.rooms
      rooms.forEach((roomId) => {
        // socket.rooms всегда содержит собственный socket.id, его пропускаем
        if (roomId === socket.id) return

        const room = io.sockets.adapter.rooms.get(roomId)
        const size = room?.size ?? 0
        if (size === 0) {
          chatService.clearRoom(roomId)
        }
      })
    })
  })
}
