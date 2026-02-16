<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roomAPI } from '@/shared/api/room.api'
import type { VideoRoom } from '@/shared/api/room.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { socketService } from '@/shared/api/socket.service'
import { useChat } from '@/shared/composables/useChat'
import { soundCloudAPI } from '@/shared/api/soundcloud.api'
import { toast } from 'vue-sonner'
import { useAuth } from '@/enteties/useAuth'

const route = useRoute()
const router = useRouter()

const roomId = route.params.id as string
const room = ref<VideoRoom | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const participants = ref(0)

const { user } = useAuth()

const { messages, newMessage, send } = useChat(roomId)

const searchQuery = ref('')
const currentTrackUrl = ref<string | null>(null)
const currentTrackTitle = ref<string | null>(null)
const currentTrackArtist = ref<string | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const statusMessage = ref<string | null>(null)
const statusType = ref<'success' | 'error' | 'info'>('info')
const isSearching = ref(false)
const suggestions = ref<
  Awaited<ReturnType<typeof soundCloudAPI.searchTracks>>
>([])
const formattedTime = computed(() => {
  const mins = Math.floor(currentTime.value / 60)
  const secs = Math.floor(currentTime.value % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})
const formattedDuration = computed(() => {
  const mins = Math.floor(duration.value / 60)
  const secs = Math.floor(duration.value % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

function loadTrack() {
  if (!searchQuery.value.trim()) {
    toast.error('Please enter a SoundCloud track URL')
    return
  }

  const value = searchQuery.value.trim()

  // Простая логика: если это URL — встраиваем, иначе игнорируем.
  if (value.startsWith('http://') || value.startsWith('https://')) {
    currentTrackUrl.value = value
    currentTrackTitle.value = 'Custom URL'
    currentTrackArtist.value = null
    toast.success('Track loaded. You can control playback in the player.')
  } else {
    toast.error('Right now only direct SoundCloud track URLs are supported.')
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
    toast.error(e.message || 'Failed to search tracks')
  } finally {
    isSearching.value = false
  }
}

let searchDebounce: number | undefined
watch(
  searchQuery,
  (val) => {
    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }

    if (!val.trim()) {
      suggestions.value = []
      return
    }

    searchDebounce = window.setTimeout(() => {
      searchSuggestions(val)
    }, 500)
  }
)

function selectSuggestion(url: string) {
  const track = suggestions.value.find((t) => t.permalinkUrl === url)
  if (!track) {
    toast.error('Track not found in suggestions.')
    return
  }

  if (!track.streamUrl) {
    toast.error('This track cannot be played with custom player (no stream URL).')
    return
  }

  currentTrackUrl.value = track.streamUrl
  currentTrackTitle.value = track.title ?? null
  currentTrackArtist.value = track.username ?? null
  suggestions.value = []
  toast.success('Track selected from suggestions.')
}

function togglePlay() {
  const audio = audioRef.value
  if (!audio || !currentTrackUrl.value) return

  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

function onLoadedMetadata() {
  const audio = audioRef.value
  if (!audio) return
  duration.value = audio.duration || 0
}

function onTimeUpdate() {
  const audio = audioRef.value
  if (!audio) return
  currentTime.value = audio.currentTime || 0
}

function onPlay() {
  isPlaying.value = true
}

function onPause() {
  isPlaying.value = false
}

function seek(e: Event) {
  const audio = audioRef.value
  if (!audio) return
  const target = e.target as HTMLInputElement
  const value = Number(target.value)
  audio.currentTime = (value / 100) * (duration.value || 1)
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

    loading.value = false
  } catch (err: any) {
    console.error(err)
    error.value = err.message || 'Failed to load SoundCloud room'
    loading.value = false
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
                class="absolute z-10 mt-1 w-full border rounded-md bg-background shadow-lg max-h-64 overflow-y-auto"
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

            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <Button size="icon" variant="outline" @click="togglePlay" :disabled="!currentTrackUrl">
                  <span v-if="!isPlaying">▶</span>
                  <span v-else>⏸</span>
                </Button>

                <div class="flex-1 flex flex-col gap-1">
                  <div class="flex items-center justify-between text-xs text-muted-foreground">
                    <span class="truncate">
                      {{ currentTrackTitle || 'No track selected' }}
                      <span v-if="currentTrackArtist" class="ml-1">· {{ currentTrackArtist }}</span>
                    </span>
                    <span>{{ formattedTime }} / {{ formattedDuration }}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    class="w-full"
                    :value="duration ? (currentTime / duration) * 100 : 0"
                    @input="seek"
                  />
                </div>
              </div>
              <audio
                ref="audioRef"
                :src="currentTrackUrl || undefined"
                @loadedmetadata="onLoadedMetadata"
                @timeupdate="onTimeUpdate"
                @play="onPlay"
                @pause="onPause"
              />
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
  </div>
</template>

