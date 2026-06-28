import { ref, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { socketService } from '@/shared/api/socket.service'
import type { ChatMessage } from '@/shared/api/chat.types'
import { API_BASE_URL } from '@/shared/config/api'
import { authStore } from '@/entities/user'

export function useChat(roomId: string) {
  const messages = ref<ChatMessage[]>([])
  const newMessage = ref('')
  const currentUserName = ref<string | null>(null)
  const user = authStore.user

  onMounted(async () => {
    try {
      await authStore.refreshUser()

      const u = user.value
      if (u) {
        currentUserName.value =
          u.firstName && u.lastName
            ? `${u.firstName} ${u.lastName}`
            : u.firstName
              ? u.firstName
              : u.email || 'Guest'
      }
    } catch (e) {
      console.error('refreshUser in useChat failed', e)
    }

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
      toast.error('Failed to load chat history')
    }
  })

  onUnmounted(() => {
    socketService.off('chat:message')
  })

  const send = () => {
    if (!newMessage.value.trim()) return

    if (!socketService.isConnected()) {
      toast.error('Message not sent. Check your connection')
      return
    }

    const text = newMessage.value.trim()
    const urlRegex = /https?:\/\/\S+/g
    const urls = text.match(urlRegex) || []

    const isSoundCloudUrl = (url: string) =>
      /^https?:\/\/(soundcloud\.com|on\.soundcloud\.com)\//i.test(url)

    const isImageUrl = (url: string) =>
      /\.(png|jpe?g|gif|webp)$/i.test(url) ||
      url.includes('image=') ||
      url.includes('img=') ||
      url.includes('photo=')

    let trackUrl: string | undefined
    let imageUrl: string | undefined

    for (const url of urls) {
      if (!trackUrl && isSoundCloudUrl(url)) {
        trackUrl = url
      }
      if (!imageUrl && isImageUrl(url)) {
        imageUrl = url
      }
    }

    const displayName =
      user.value?.firstName && user.value?.lastName
        ? `${user.value.firstName} ${user.value.lastName}`
        : user.value?.firstName
          ? user.value.firstName
          : user.value?.email || 'Guest'

    currentUserName.value = displayName

    const msg: ChatMessage = {
      room: roomId,
      author: displayName,
      text,
      time: Date.now(),
      trackUrl,
      imageUrl,
    }

    socketService.emit('chat:send', msg)
    newMessage.value = ''
  }

  const sendFile = (file: File) => {
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isAudio = file.type.startsWith('audio/')
    if (!isImage && !isAudio) {
      toast.error('Only image and audio files are supported')
      return
    }

    if (!socketService.isConnected()) {
      toast.error('File not sent. Check your connection')
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      toast.error('Failed to send file')
    }
    reader.onload = () => {
      const displayName =
        user.value?.firstName && user.value?.lastName
          ? `${user.value.firstName} ${user.value.lastName}`
          : user.value?.firstName
            ? user.value.firstName
            : user.value?.email || 'Guest'

      currentUserName.value = displayName

      const msg: ChatMessage = {
        room: roomId,
        author: displayName,
        text: file.name,
        time: Date.now(),
        trackUrl: isAudio ? (reader.result as string) : undefined,
        imageUrl: isImage ? (reader.result as string) : undefined,
      }

      socketService.emit('chat:send', msg)
    }

    reader.readAsDataURL(file)
  }

  return { messages, newMessage, send, sendFile, currentUserName }
}
