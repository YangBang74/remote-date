<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roomAPI } from '@/shared/api/room.api'
import type { VideoRoom } from '@/shared/api/room.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import SoundPlayerBar from './ui/SoundPlayerBar.vue'
import { socketService } from '@/shared/api/socket.service'
import { useChat } from '@/shared/composables/useChat'
import { soundCloudAPI } from '@/shared/api/soundcloud.api'
import { toast } from 'vue-sonner'
import RoomChatPanel from './ui/RoomChatPanel.vue'

const route = useRoute()
const router = useRouter()

const roomId = route.params.id as string
const room = ref<VideoRoom | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const participants = ref(0)
const { messages, newMessage, send, currentUserName } = useChat(roomId)

const searchQuery = ref('')
const currentTrackUrl = ref<string | null>(null)
const currentTrackTitle = ref<string | null>(null)
const currentTrackArtist = ref<string | null>(null)
const currentArtworkUrl = ref<string | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)
const muted = ref(false)
const isSearching = ref(false)
const suggestions = ref<
  Awaited<ReturnType<typeof soundCloudAPI.searchTracks>>
>([])
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

function loadTrackFromChat(url: string) {
  if (!url) return
  searchQuery.value = url
  currentTrackUrl.value = url
  currentTrackTitle.value = 'Shared track'
  currentTrackArtist.value = null
  toast.success('Track from chat loaded to player')
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
  currentArtworkUrl.value = track.artworkUrl ?? null
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
  // Sync initial volume state with the audio element
  volume.value = (audio.volume ?? 1) * 100
  muted.value = audio.muted
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

function toggleMute() {
  const audio = audioRef.value
  if (!audio) return

  const nextMuted = !audio.muted
  audio.muted = nextMuted
  muted.value = nextMuted
}

function changeVolume(value: number) {
  const audio = audioRef.value
  if (!audio) return

  const clamped = Math.max(0, Math.min(100, value))
  volume.value = clamped
  audio.volume = clamped / 100

  if (clamped === 0) {
    audio.muted = true
    muted.value = true
  } else if (muted.value && audio.muted) {
    audio.muted = false
    muted.value = false
  }
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
  <div class="p-6 space-y-4 relative">
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
      <!-- Left column: player & search -->
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

            <SoundPlayerBar
              :title="currentTrackTitle || 'No track selected'"
              :artist="currentTrackArtist || ''"
              :artwork-url="currentArtworkUrl || suggestions[0]?.artworkUrl || ''"
              :is-playing="isPlaying"
              :current-time="currentTime"
              :duration="duration"
              :can-play="!!currentTrackUrl"
              :volume="volume"
              :muted="muted"
              @togglePlay="togglePlay"
              @seek="(value) => seek({ target: { value: String(value) } } as any)"
              @toggleMute="toggleMute"
              @changeVolume="changeVolume" />
            <audio
              ref="audioRef"
              :src="currentTrackUrl || undefined"
              @loadedmetadata="onLoadedMetadata"
              @timeupdate="onTimeUpdate"
              @play="onPlay"
              @pause="onPause"
            />
          </CardContent>
        </Card>
      </div>

      <!-- Right column: chat -->
      <RoomChatPanel
        :messages="messages"
        :new-message="newMessage"
        :current-user-name="currentUserName"
        @update:new-message="(v) => (newMessage = v)"
        @send="send"
        @playTrack="loadTrackFromChat"
      />
    </div>
  </div>
</template>

