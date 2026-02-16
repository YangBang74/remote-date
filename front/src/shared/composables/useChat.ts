import { ref, onMounted, onUnmounted } from 'vue'
import { socketService } from '@/shared/api/socket.service'
import type { ChatMessage } from '@/shared/api/chat.types'
import { API_BASE_URL } from '@/shared/config/api'
import { useAuth } from '@/enteties/useAuth'

export function useChat(roomId: string) {
  const messages = ref<ChatMessage[]>([])
  const newMessage = ref('')
  const { user, checkAuth } = useAuth()

  onMounted(async () => {
    // Пытаемся подтянуть пользователя, если есть токены
    try {
      await checkAuth()
    } catch (e) {
      console.error('checkAuth in useChat failed', e)
    }

    socketService.connect()
    socketService.emit('join_room', roomId)

    socketService.on('chat:message', (msg) => {
      if (msg.room === roomId) {
        messages.value.push(msg)
      }
    })

    try {
      const res = await fetch(`${API_BASE_URL}/chat/${roomId}`)
      if (res.ok) {
        const history = (await res.json()) as ChatMessage[]
        messages.value = history
      }
    } catch (e) {
      console.error('Failed to load chat history', e)
    }
  })

  onUnmounted(() => {
    socketService.off('chat:message')
  })

  const send = () => {
    if (!newMessage.value.trim()) return

    const text = newMessage.value.trim()
    const urlRegex = /https?:\/\/\S+/
    const match = urlRegex.exec(text)
    console.log('user', user.value)
    const displayName =
      user.value?.firstName && user.value?.lastName
        ? `${user.value.firstName} ${user.value.lastName}`
        : user.value?.firstName
        ? user.value.firstName
        : user.value?.email || 'Guest'

    const msg: ChatMessage = {
      room: roomId,
      author: displayName,
      text,
      time: Date.now(),
      trackUrl: match ? match[0] : undefined,
    }

    socketService.emit('chat:send', msg)
    newMessage.value = ''
  }

  return { messages, newMessage, send }
}

