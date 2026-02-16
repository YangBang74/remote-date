import { ChatMessage } from './chat.types'

class ChatService {
  // Память для сообщений по комнатам (ин-мемори, пока есть участники)
  private roomMessages = new Map<string, ChatMessage[]>()

  async saveMessage(msg: ChatMessage) {
    const list = this.roomMessages.get(msg.room) ?? []
    list.push(msg)
    // На всякий случай ограничим историю, чтобы не росла бесконечно
    const MAX_MESSAGES_PER_ROOM = 500
    if (list.length > MAX_MESSAGES_PER_ROOM) {
      list.shift()
    }
    this.roomMessages.set(msg.room, list)
    console.log('Saved chat message:', msg)
  }

  async getMessages(room: string) {
    return this.roomMessages.get(room) ?? []
  }

  /**
   * Очистить историю комнаты, когда из неё вышли все участники
   */
  clearRoom(room: string) {
    this.roomMessages.delete(room)
    console.log('Cleared chat history for room:', room)
  }
}

export const chatService = new ChatService()

