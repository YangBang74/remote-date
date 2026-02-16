<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roomAPI } from '@/shared/api/room.api'
import { socketService } from '@/shared/api/socket.service'
import type { VideoRoom, VideoState } from '@/shared/api/room.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { useChat } from '@/shared/composables/useChat'

const route = useRoute()
const router = useRouter()

const roomId = route.params.id as string
const room = ref<VideoRoom | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const participants = ref(0)

// Chat
const { messages, newMessage, send } = useChat(roomId)

// YouTube player instance
let player: any = null
const isLocalAction = ref(false)
const playerReady = ref(false)
const currentUrl = ref('')
let seekInterval: number | null = null

// Инициализация YouTube IFrame API
onMounted(async () => {
  try {
    // Загружаем YouTube API заранее
    await loadYouTubeAPI()

    // Загружаем информацию о комнате
    room.value = await roomAPI.getRoom(roomId)
    participants.value = room.value.participants
    currentUrl.value = window.location.href

    // Устанавливаем loading в false, чтобы Vue отрендерил элемент
    loading.value = false

    // Подключаемся к Socket.io
    socketService.connect()

    // Присоединяемся к комнате
    socketService.emit('room:join', roomId)

    // Слушаем события (только после инициализации плеера будем обрабатывать)
    socketService.on('video:state', handleVideoState)
    socketService.on('video:play', handleVideoPlay)
    socketService.on('video:pause', handleVideoPause)
    socketService.on('video:seek', handleVideoSeek)
    socketService.on('video:sync', handleVideoState)
    socketService.on('room:user_joined', handleUserJoined)
    socketService.on('room:user_left', handleUserLeft)
    socketService.on('room:error', handleError)

    // Ждем, пока DOM обновится после установки loading = false
    await nextTick()

    // Теперь инициализируем плеер, когда элемент точно есть в DOM
    await initializePlayer()
  } catch (err: any) {
    console.error('Error in onMounted:', err)
    error.value = err.message || 'Failed to load room'
    loading.value = false
  }
})

// Следим за изменениями, чтобы переинициализировать плеер, если нужно
watch([room, loading], async ([newRoom, newLoading]) => {
  if (newRoom && !newLoading && !playerReady.value && !player) {
    console.log('Room loaded and ready, initializing player...')
    await nextTick()
    await initializePlayer()
  }
})

// Загрузка YouTube IFrame API
function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    const YT = (window as any).YT
    if (YT && YT.Player) {
      console.log('YouTube API already loaded')
      resolve()
      return
    }

    // Сохраняем существующий callback, если есть
    const existingCallback = (window as any).onYouTubeIframeAPIReady
    ;(window as any).onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready callback called')
      if (existingCallback) {
        existingCallback()
      }
      resolve()
    }

    // Загружаем скрипт, если еще не загружен
    if (!YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      const firstScriptTag = document.getElementsByTagName('script')[0]
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      } else {
        document.head.appendChild(tag)
      }
      console.log('Loading YouTube IFrame API...')
    } else {
      resolve()
    }
  })
}

// Обработчик изменения размера окна
function handleResize() {
  if (player && playerReady.value) {
    const playerElement = document.getElementById('youtube-player')
    if (playerElement) {
      const container = playerElement.parentElement
      if (container) {
        const rect = container.getBoundingClientRect()
        const width = Math.floor(rect.width || 640)
        const height = Math.floor(rect.height || 360)

        try {
          if (typeof player.setSize === 'function') {
            player.setSize(width, height)
          }
        } catch (e) {
          console.error('Error resizing player:', e)
        }
      }
    }
  }
}

onUnmounted(() => {
  // Удаляем обработчик resize
  window.removeEventListener('resize', handleResize)

  // Отключаемся от комнаты
  if (roomId) {
    socketService.emit('room:leave', roomId)
  }

  // Очищаем слушатели
  socketService.off('video:state')
  socketService.off('video:play')
  socketService.off('video:pause')
  socketService.off('video:seek')
  socketService.off('room:user_joined')
  socketService.off('room:user_left')
  socketService.off('room:error')

  // Очищаем интервал перемотки
  if (seekInterval) {
    clearInterval(seekInterval)
    seekInterval = null
  }

  // Сбрасываем счетчики повторов
  videoStateRetryCount = 0

  // Уничтожаем плеер
  if (player && typeof player.destroy === 'function') {
    try {
      player.destroy()
    } catch (e) {
      console.error('Error destroying player:', e)
    }
    player = null
  }

  playerReady.value = false
})

async function initializePlayer() {
  if (!room.value) {
    console.error('Room data not loaded')
    error.value = 'Room data not loaded'
    loading.value = false
    return
  }

  // Ждем несколько тиков, чтобы гарантировать рендер элемента
  await nextTick()
  await nextTick()

  // Проверяем, что элемент существует в DOM с несколькими попытками
  let playerElement = document.getElementById('youtube-player')
  let retries = 0
  while (!playerElement && retries < 10) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    playerElement = document.getElementById('youtube-player')
    retries++
  }

  if (!playerElement) {
    console.error('YouTube player element not found in DOM after retries')
    error.value = 'Failed to initialize player: element not found'
    loading.value = false
    return
  }

  console.log('YouTube player element found in DOM')

  // Получаем размеры контейнера
  const container = playerElement.parentElement
  if (!container) {
    console.error('Player container not found')
    error.value = 'Failed to initialize player: container not found'
    loading.value = false
    return
  }

  const rect = container.getBoundingClientRect()
  const width = rect.width || 640
  const height = rect.height || 360

  console.log(`Initializing YouTube player with dimensions: ${width}x${height}`)
  console.log(`Video ID: ${room.value.youtubeVideoId}`)

  const YT = (window as any).YT
  if (!YT || !YT.Player) {
    console.error('YouTube IFrame API not loaded')
    error.value = 'Failed to load YouTube IFrame API'
    loading.value = false
    return
  }

  // Уничтожаем существующий плеер, если есть
  if (player && typeof player.destroy === 'function') {
    try {
      player.destroy()
      player = null
    } catch (e) {
      console.error('Error destroying existing player:', e)
    }
  }

  try {
    // Инициализируем плеер с числовыми размерами
    player = new YT.Player('youtube-player', {
      videoId: room.value.youtubeVideoId,
      width: Math.floor(width),
      height: Math.floor(height),
      playerVars: {
        controls: 1,
        rel: 0,
        autoplay: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    })

    console.log('YouTube player created successfully')
    loading.value = false
  } catch (err: any) {
    console.error('Error initializing player:', err)
    error.value = 'Failed to initialize YouTube player: ' + (err.message || 'Unknown error')
    loading.value = false
  }
}

function onPlayerError(event: any) {
  console.error('YouTube player error:', event.data)
  error.value = 'Error loading video. Please check the video URL.'
}

function onPlayerReady(event: any) {
  console.log('YouTube player ready')
  playerReady.value = true
  player = event.target

  // Добавляем обработчик изменения размера окна
  window.addEventListener('resize', handleResize)

  // Запрашиваем синхронизацию при готовности плеера
  socketService.emit('video:sync_request', roomId)

  // Отслеживаем перемотку через периодическую проверку
  let lastTime = 0
  try {
    lastTime = player.getCurrentTime() || 0
  } catch (e) {
    console.error('Error getting current time:', e)
  }

  seekInterval = window.setInterval(() => {
    if (!player || !playerReady.value || isLocalAction.value) return

    try {
      const currentTime = player.getCurrentTime() || 0
      const timeDiff = Math.abs(currentTime - lastTime)
      const playerState = player.getPlayerState()

      // Если разница больше 2 секунд, значит произошла перемотка
      if (timeDiff > 2) {
        // Ставим на паузу при перемотке
        if (playerState === 1) {
          // Если видео играет, ставим на паузу
          isLocalAction.value = true
          player.pauseVideo()
          socketService.emit('video:pause', {
            roomId,
            currentTime,
          })
          setTimeout(() => {
            isLocalAction.value = false
          }, 500)
        }

        // Отправляем событие перемотки
        socketService.emit('video:seek', {
          roomId,
          currentTime,
        })
      }

      lastTime = currentTime
    } catch (e) {
      console.error('Error in seek interval:', e)
    }
  }, 500) as any
}

function onPlayerStateChange(event: any) {
  // Если это действие было инициировано сервером, игнорируем
  if (isLocalAction.value || !playerReady.value) {
    // Не сбрасываем сразу, даем время на завершение операции
    return
  }

  try {
    const currentTime = event.target.getCurrentTime() || 0
    const state = event.data

    // Отправляем только значимые изменения состояния (игнорируем BUFFERING)
    if (state === 1) {
      // Воспроизведение
      socketService.emit('video:play', {
        roomId,
        currentTime,
      })
    } else if (state === 2 || state === 0) {
      // Пауза или конец
      socketService.emit('video:pause', {
        roomId,
        currentTime,
      })
    }
  } catch (e) {
    console.error('Error in onPlayerStateChange:', e)
  }
}

// Обработчики событий от других участников
let videoStateRetryCount = 0
const MAX_VIDEO_STATE_RETRIES = 20 // Максимум 10 секунд (20 * 500ms)

function handleVideoState(state: VideoState) {
  if (!player || !playerReady.value) {
    videoStateRetryCount++
    if (videoStateRetryCount >= MAX_VIDEO_STATE_RETRIES) {
      console.warn('Player not ready after maximum retries, skipping video state sync')
      videoStateRetryCount = 0
      return
    }
    // Если плеер еще не готов, откладываем синхронизацию
    setTimeout(() => handleVideoState(state), 500)
    return
  }

  // Сбрасываем счетчик при успешной обработке
  videoStateRetryCount = 0

  try {
    // Устанавливаем флаг перед всеми операциями
    isLocalAction.value = true

    // Рассчитываем задержку и компенсируем ее
    const delay = (Date.now() - state.timestamp) / 1000
    const targetTime = Math.max(0, state.currentTime + delay)

    // Сначала перематываем с учетом задержки
    if (typeof player.seekTo === 'function') {
      player.seekTo(targetTime, true)
    }

    // Затем изменяем состояние воспроизведения
    if (state.isPlaying) {
      if (typeof player.playVideo === 'function') {
        player.playVideo()
      }
    } else {
      if (typeof player.pauseVideo === 'function') {
        player.pauseVideo()
      }
    }

    // Увеличиваем время блокировки, чтобы избежать повторных событий
    setTimeout(() => {
      isLocalAction.value = false
    }, 500) // Увеличено с 100ms до 500ms
  } catch (e) {
    console.error('Error in handleVideoState:', e)
    // В случае ошибки все равно сбрасываем флаг
    setTimeout(() => {
      isLocalAction.value = false
    }, 500)
  }
}

function handleVideoPlay(data: { currentTime: number; timestamp: number }) {
  if (!player || !playerReady.value || isLocalAction.value) return

  try {
    // Устанавливаем флаг перед операциями
    isLocalAction.value = true

    // Рассчитываем задержку в секундах
    const networkDelay = (Date.now() - data.timestamp) / 1000

    // Если видео было на паузе, просто перематываем и запускаем
    // Если видео играло, нужно учесть время, которое прошло во время задержки сети
    const playerState = player.getPlayerState()
    let targetTime = data.currentTime

    if (playerState === 1) {
      // Если видео уже играет, добавляем задержку сети к времени
      targetTime = data.currentTime + networkDelay
    } else {
      // Если видео на паузе, просто добавляем небольшую компенсацию
      targetTime = data.currentTime + Math.min(networkDelay * 0.5, 0.1)
    }

    targetTime = Math.max(0, targetTime)

    // Сначала перематываем
    if (typeof player.seekTo === 'function') {
      player.seekTo(targetTime, true)
    }

    // Затем запускаем воспроизведение
    if (typeof player.playVideo === 'function') {
      player.playVideo()
    }

    // Увеличиваем время блокировки
    setTimeout(() => {
      isLocalAction.value = false
    }, 500)
  } catch (e) {
    console.error('Error in handleVideoPlay:', e)
    setTimeout(() => {
      isLocalAction.value = false
    }, 500)
  }
}

function handleVideoPause(data: { currentTime: number; timestamp: number }) {
  if (!player || !playerReady.value || isLocalAction.value) return

  try {
    // Устанавливаем флаг перед операциями
    isLocalAction.value = true

    // Рассчитываем задержку в секундах
    const networkDelay = (Date.now() - data.timestamp) / 1000

    // Для паузы учитываем, что видео продолжало играть во время задержки сети
    const playerState = player.getPlayerState()
    let targetTime = data.currentTime

    if (playerState === 1) {
      // Если видео играет, добавляем задержку сети
      targetTime = data.currentTime + networkDelay
    } else {
      // Если уже на паузе, используем время с небольшой компенсацией
      targetTime = data.currentTime + Math.min(networkDelay * 0.5, 0.05)
    }

    targetTime = Math.max(0, targetTime)

    // Сначала перематываем
    if (typeof player.seekTo === 'function') {
      player.seekTo(targetTime, true)
    }

    // Затем ставим на паузу
    if (typeof player.pauseVideo === 'function') {
      player.pauseVideo()
    }

    // Увеличиваем время блокировки
    setTimeout(() => {
      isLocalAction.value = false
    }, 500)
  } catch (e) {
    console.error('Error in handleVideoPause:', e)
    setTimeout(() => {
      isLocalAction.value = false
    }, 500)
  }
}

function handleVideoSeek(data: { currentTime: number; timestamp: number }) {
  if (!player || !playerReady.value || isLocalAction.value) return

  try {
    // Устанавливаем флаг перед операцией
    isLocalAction.value = true

    // Рассчитываем задержку в секундах
    const networkDelay = (Date.now() - data.timestamp) / 1000

    // Для перемотки учитываем, что видео могло продолжать играть во время задержки сети
    const playerState = player.getPlayerState()
    let targetTime = data.currentTime

    if (playerState === 1) {
      // Если видео играет, добавляем задержку сети
      targetTime = data.currentTime + networkDelay
    } else {
      // Если на паузе, используем время с минимальной компенсацией
      targetTime = data.currentTime + Math.min(networkDelay * 0.3, 0.05)
    }

    targetTime = Math.max(0, targetTime)

    // Перематываем
    if (typeof player.seekTo === 'function') {
      player.seekTo(targetTime, true)
    }

    // Ставим на паузу после перемотки
    if (typeof player.pauseVideo === 'function') {
      player.pauseVideo()
    }

    // Увеличиваем время блокировки
    setTimeout(() => {
      isLocalAction.value = false
    }, 500)
  } catch (e) {
    console.error('Error in handleVideoSeek:', e)
    setTimeout(() => {
      isLocalAction.value = false
    }, 500)
  }
}

function handleUserJoined(data: { roomId: string; participants: number }) {
  participants.value = data.participants
}

function handleUserLeft(data: { roomId: string; participants: number }) {
  participants.value = data.participants
}

function handleError(error: { message: string }) {
  console.error('Room error:', error.message)
}

function copyLink() {
  navigator.clipboard.writeText(currentUrl.value)
  alert('Link copied!')
}
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

    <div v-else-if="room" class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Room: {{ room.id.slice(0, 8) }}...</span>
            <span class="text-sm font-normal"> Participants: {{ participants }} </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            id="youtube-player-container"
            class="aspect-video w-full bg-black rounded-lg overflow-hidden"
            style="position: relative; min-height: 360px">
            <div
              id="youtube-player"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <p class="text-sm text-muted-foreground">
            Share this room with others to watch together!
          </p>
          <div class="mt-2 flex items-center gap-2">
            <input
              :value="currentUrl"
              readonly
              class="flex-1 px-3 py-2 border rounded-md text-sm" />
            <Button size="sm" @click="copyLink"> Copy Link </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="h-64 overflow-y-auto border rounded-md p-2 space-y-1 text-sm">
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
  </div>
</template>

<script lang="ts">
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
</script>
