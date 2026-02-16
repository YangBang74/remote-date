<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roomAPI } from '@/shared/api/room.api'
import type { VideoRoom } from '@/shared/api/room.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { socketService } from '@/shared/api/socket.service'
import { useChat } from '@/shared/composables/useChat'
import { soundCloudAPI } from '@/shared/api/soundcloud.api'

const route = useRoute()
const router = useRouter()

const roomId = route.params.id as string
const room = ref<VideoRoom | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const participants = ref(0)

const { messages, newMessage, send } = useChat(roomId)

const searchQuery = ref('')
const currentTrackPermalink = ref<string | null>(null)
const currentTrackTitle = ref<string | null>(null)
const currentTrackArtist = ref<string | null>(null)
const statusMessage = ref<string | null>(null)
const statusType = ref<'success' | 'error' | 'info'>('info')
const isSearching = ref(false)
const suggestions = ref<Awaited<ReturnType<typeof soundCloudAPI.searchTracks>>>([])

// SoundCloud Widget
const widgetIframeRef = ref<HTMLIFrameElement | null>(null)
const widgetInstance = ref<any | null>(null)
const widgetReady = ref(false)
const isLocalAction = ref(false)

type ToastType = 'success' | 'error' | 'info'
interface Toast {
  id: number
  message: string
  type: ToastType
}
const toasts = ref<Toast[]>([])
let toastId = 0

function showToast(type: ToastType, message: string) {
  statusType.value = type
  statusMessage.value = message
  const id = ++toastId
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3000)
}

const embedUrl = computed(() => {
  if (!currentTrackPermalink.value) return ''
  const url = new URL('https://w.soundcloud.com/player/')
  url.searchParams.set('url', currentTrackPermalink.value)
  url.searchParams.set('auto_play', 'false')
  url.searchParams.set('show_comments', 'false')
  url.searchParams.set('visual', 'false')
  url.searchParams.set('hide_related', 'true')
  url.searchParams.set('show_user', 'false')
  url.searchParams.set('show_reposts', 'false')
  return url.toString()
})

function loadTrack() {
  statusMessage.value = null

  if (!searchQuery.value.trim()) {
    showToast('error', 'Please enter a SoundCloud track URL')
    return
  }

  const value = searchQuery.value.trim()

  // Простая логика: если это URL — встраиваем, иначе игнорируем.
  if (value.startsWith('http://') || value.startsWith('https://')) {
    currentTrackPermalink.value = value
    currentTrackTitle.value = 'Custom URL'
    currentTrackArtist.value = null
    showToast('success', 'Track loaded. You can control playback in the player.')

    // Отправляем событие выбора трека другим участникам
    socketService.emit('soundcloud:track_selected', {
      roomId,
      permalink: value,
      title: 'Custom URL',
      artist: null,
    })
  } else {
    showToast('error', 'Right now only direct SoundCloud track URLs are supported.')
  }
}

async function searchSuggestions(query: string) {
  if (!query.trim()) {
    suggestions.value = []
    return
  }

  try {
    isSearching.value = true
    const tracks = await soundCloudAPI.searchTracks(query, 5)
    suggestions.value = tracks
  } catch (e: any) {
    console.error(e)
    showToast('error', e.message || 'Failed to search tracks')
  } finally {
    isSearching.value = false
  }
}

let searchDebounce: number | undefined
watch(
  searchQuery,
  (val) => {
    statusMessage.value = null

    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }

    if (!val.trim()) {
      suggestions.value = []
      return
    }

    searchDebounce = setTimeout(() => {
      searchSuggestions(val)
    }, 500) as any
  }
)

function selectSuggestion(url: string) {
  const track = suggestions.value.find((t) => t.permalinkUrl === url)
  if (!track) {
    showToast('error', 'Track not found in suggestions.')
    return
  }

  currentTrackPermalink.value = track.permalinkUrl
  currentTrackTitle.value = track.title ?? null
  currentTrackArtist.value = track.username ?? null
  showToast('success', 'Track selected from suggestions.')
  suggestions.value = []

  // Отправляем событие выбора трека другим участникам
  socketService.emit('soundcloud:track_selected', {
    roomId,
    permalink: track.permalinkUrl,
    title: track.title ?? null,
    artist: track.username ?? null,
  })
}

onMounted(async () => {
  try {
    room.value = await roomAPI.getRoom(roomId)

    if (!room.value || room.value.type !== 'soundcloud') {
      error.value = 'SoundCloud room not found'
      loading.value = false
      return
    }

    participants.value = room.value.participants

    socketService.connect()
    socketService.emit('room:join', roomId)

    socketService.on('room:user_joined', (data) => {
      if (data.roomId === roomId) {
        participants.value = data.participants
      }
    })

    socketService.on('room:user_left', (data) => {
      if (data.roomId === roomId) {
        participants.value = data.participants
      }
    })

    // Слушаем события выбора трека от других участников
    socketService.on('soundcloud:track_selected', (data) => {
      currentTrackPermalink.value = data.permalink
      currentTrackTitle.value = data.title
      currentTrackArtist.value = data.artist
      // Переинициализируем виджет при смене трека
      widgetReady.value = false
      nextTick(() => {
        initWidget()
      })
    })

    // Слушаем события play/pause от других участников
    socketService.on('soundcloud:play', () => {
      console.log('SoundCloud: received play event from socket')
      if (!isLocalAction.value && widgetInstance.value && widgetReady.value) {
        console.log('SoundCloud: executing play on widget')
        isLocalAction.value = true
        try {
          widgetInstance.value.play()
        } catch (e) {
          console.error('Widget play error', e)
        }
        setTimeout(() => {
          isLocalAction.value = false
        }, 500)
      } else {
        console.log('SoundCloud: play skipped', {
          isLocalAction: isLocalAction.value,
          hasWidget: !!widgetInstance.value,
          widgetReady: widgetReady.value,
        })
      }
    })

    socketService.on('soundcloud:pause', () => {
      console.log('SoundCloud: received pause event from socket')
      if (!isLocalAction.value && widgetInstance.value && widgetReady.value) {
        console.log('SoundCloud: executing pause on widget')
        isLocalAction.value = true
        try {
          widgetInstance.value.pause()
        } catch (e) {
          console.error('Widget pause error', e)
        }
        setTimeout(() => {
          isLocalAction.value = false
        }, 500)
      } else {
        console.log('SoundCloud: pause skipped', {
          isLocalAction: isLocalAction.value,
          hasWidget: !!widgetInstance.value,
          widgetReady: widgetReady.value,
        })
      }
    })

    loading.value = false
  } catch (err: any) {
    console.error(err)
    error.value = err.message || 'Failed to load SoundCloud room'
    loading.value = false
  }
})

function handleIframeLoad() {
  console.log('SoundCloud iframe loaded')
  const timerId = setTimeout(() => {
    initWidget()
  }, 500)
  return timerId
}

async function initWidget() {
  await nextTick()
  await nextTick() // Дополнительная задержка для загрузки iframe
  
  const iframe = widgetIframeRef.value
  const SC = (window as any).SC

  if (!iframe) {
    console.warn('SoundCloud widget: iframe not found')
    return
  }

  if (!SC || !SC.Widget) {
    console.warn('SoundCloud widget: SC.Widget not available, retrying...')
    const timerId = setTimeout(() => {
      initWidget()
    }, 500)
    return timerId
  }

  // Если виджет уже инициализирован, не переинициализируем
  if (widgetInstance.value) {
    console.log('SoundCloud widget: already initialized')
    return
  }

  try {
    console.log('SoundCloud widget: initializing...')
    const widget = SC.Widget(iframe)
    widgetInstance.value = widget
    widgetReady.value = false

    widget.bind(SC.Widget.Events.READY, () => {
      console.log('SoundCloud widget: READY')
      widgetReady.value = true
    })

    widget.bind(SC.Widget.Events.PLAY_PROGRESS, () => {
      // Это событие срабатывает во время воспроизведения
    })

    widget.bind(SC.Widget.Events.PLAY, () => {
      console.log('SoundCloud widget: PLAY event received', {
        isLocalAction: isLocalAction.value,
        widgetReady: widgetReady.value,
      })
      if (!isLocalAction.value && widgetReady.value) {
        console.log('SoundCloud widget: emitting play to socket')
        socketService.emit('soundcloud:play', { roomId })
      } else {
        console.log('SoundCloud widget: play event ignored (local action or not ready)')
      }
    })

    widget.bind(SC.Widget.Events.PAUSE, () => {
      console.log('SoundCloud widget: PAUSE event received', {
        isLocalAction: isLocalAction.value,
        widgetReady: widgetReady.value,
      })
      if (!isLocalAction.value && widgetReady.value) {
        console.log('SoundCloud widget: emitting pause to socket')
        socketService.emit('soundcloud:pause', { roomId })
      } else {
        console.log('SoundCloud widget: pause event ignored (local action or not ready)')
      }
    })

    widget.bind(SC.Widget.Events.FINISH, () => {
      console.log('SoundCloud widget: FINISH event')
    })

    console.log('SoundCloud widget: bindings set up')
  } catch (e) {
    console.error('Failed to init SoundCloud widget', e)
  }
}

// Инициализируем виджет при изменении embedUrl
watch(embedUrl, (newUrl) => {
  if (newUrl) {
    console.log('SoundCloud widget: embedUrl changed, resetting widget')
    widgetInstance.value = null
    widgetReady.value = false
    // Даём время iframe загрузиться
    setTimeout(() => {
      initWidget()
    }, 1000)
  }
}, { immediate: false })

onUnmounted(() => {
  // Очищаем слушатели сокетов
  socketService.off('room:user_joined')
  socketService.off('room:user_left')
  socketService.off('soundcloud:track_selected')
  socketService.off('soundcloud:play')
  socketService.off('soundcloud:pause')
  
  // Отключаемся от комнаты
  if (roomId) {
    socketService.emit('room:leave', roomId)
  }
})
</script>

<template>
  <div class="p-6 space-y-4">
    <Card v-if="loading">
      <CardContent class="p-6">
        <Skeleton class="w-full h-96" />
      </CardContent>
    </Card>

    <div v-else-if="error" class="text-center space-y-4">
      <p class="text-red-500">{{ error }}</p>
      <Button @click="router.push('/')">Go Home</Button>
    </div>

    <div v-else-if="room" class="grid gap-4 md:grid-cols-[2fr,1fr]">
      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <span>SoundCloud Room: {{ room.id.slice(0, 8) }}...</span>
              <span class="text-sm font-normal"> Participants: {{ participants }} </span>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2 relative">
              <input
                v-model="searchQuery"
                type="text"
                class="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Search or paste SoundCloud track URL"
                @keyup.enter="loadTrack"
              />
              <div
                v-if="suggestions.length"
                class="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background shadow-lg"
              >
                <div
                  v-for="track in suggestions"
                  :key="track.id"
                  class="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-accent"
                  @click="selectSuggestion(track.permalinkUrl)"
                >
                  <img
                    v-if="track.artworkUrl"
                    :src="track.artworkUrl"
                    alt=""
                    class="w-8 h-8 rounded object-cover"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium truncate">{{ track.title }}</p>
                    <p class="text-[10px] text-muted-foreground truncate">
                      {{ track.username }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="text-sm font-medium">
                {{ currentTrackTitle || 'No track selected' }}
                <span v-if="currentTrackArtist" class="ml-1 text-xs text-muted-foreground">
                  · {{ currentTrackArtist }}
                </span>
              </div>
              <div class="sticky bottom-0 left-0 w-full rounded-lg overflow-hidden border bg-black/80">
                <iframe
                  v-if="embedUrl"
                  ref="widgetIframeRef"
                  class="w-full h-32 md:h-40"
                  :src="embedUrl"
                  frameborder="0"
                  allow="autoplay"
                  @load="handleIframeLoad"
                ></iframe>
                <div v-else class="h-32 md:h-40 flex items-center justify-center text-sm text-muted-foreground">
                  Choose a track to start listening
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="h-80 overflow-y-auto border rounded-md p-2 space-y-1 text-sm">
            <div v-for="(msg, idx) in messages" :key="idx">
              <span class="font-semibold">{{ msg.author }}: </span>
              <span>{{ msg.text }}</span>
              <a
                v-if="msg.trackUrl"
                :href="msg.trackUrl"
                target="_blank"
                rel="noopener"
                class="text-blue-500 underline ml-1"
              >
                track
              </a>
            </div>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newMessage"
              type="text"
              class="flex-1 px-3 py-2 border rounded-md text-sm"
              placeholder="Send message or paste track link"
              @keyup.enter="send"
            />
            <Button size="sm" @click="send">Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
    <!-- Toasts -->
    <div class="fixed bottom-4 right-4 space-y-2 z-50">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="px-3 py-2 rounded-md shadow-lg text-sm"
        :class="{
          'bg-emerald-600 text-white': toast.type === 'success',
          'bg-red-600 text-white': toast.type === 'error',
          'bg-neutral-800 text-white': toast.type === 'info',
        }"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

