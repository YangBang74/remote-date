<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { roomAPI } from '@/shared/api/room.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Label } from '@/shared/ui/label'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'

const router = useRouter()
const soundcloudUrl = ref('')
const roomIdToJoin = ref('')
const createLoading = ref(false)
const joinLoading = ref(false)
const createError = ref<string | null>(null)
const joinError = ref<string | null>(null)

async function createRoom(withUrl = false) {
  createLoading.value = true
  createError.value = null

  try {
    let room
    if (withUrl && soundcloudUrl.value.trim()) {
      room = await roomAPI.createRoom({ type: 'soundcloud', soundcloudUrl: soundcloudUrl.value })
    } else {
      room = await roomAPI.createRoom({ type: 'soundcloud' })
    }
    router.push(`/sound-room/${room.id}`)
  } catch (err: any) {
    createError.value = err.message || 'Failed to create room'
  } finally {
    createLoading.value = false
  }
}

async function joinRoom() {
  const id = roomIdToJoin.value.trim()
  if (!id) {
    joinError.value = 'Please enter a room ID'
    return
  }

  joinLoading.value = true
  joinError.value = null

  try {
    const room = await roomAPI.getRoom(id)
    if (room.type !== 'soundcloud') {
      joinError.value = 'This is not a SoundCloud room'
      return
    }
    router.push(`/sound-room/${id}`)
  } catch (err: any) {
    joinError.value = err.message || 'Room not found'
  } finally {
    joinLoading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="grid md:grid-cols-2 grid-cols-1 gap-6 w-full max-w-4xl">
      <Card class="flex-1 min-w-0">
        <CardHeader>
          <CardTitle>Create SoundCloud room</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="soundcloud-url">Optional: paste SoundCloud track URL</Label>
            <Input
              id="soundcloud-url"
              v-model="soundcloudUrl"
              type="text"
              placeholder="https://soundcloud.com/..."
            />
            <p class="text-sm text-muted-foreground">
              Create an empty room and choose tracks inside, or start with a track URL.
            </p>
            <p v-if="createError" class="text-sm text-red-500">{{ createError }}</p>
          </div>
          <div class="flex gap-2">
            <Button @click="createRoom(false)" class="flex-1" :disabled="createLoading">
              {{ createLoading ? 'Creating...' : 'Create empty room' }}
            </Button>
            <Button
              v-if="soundcloudUrl.trim()"
              variant="secondary"
              class="flex-1"
              @click="createRoom(true)"
              :disabled="createLoading"
            >
              Create with track
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card class="flex-1 min-w-0">
        <CardHeader>
          <CardTitle>Join SoundCloud room</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4 flex flex-col justify-between h-full">
          <div class="space-y-2">
            <Label for="room-id">Room ID</Label>
            <Input
              id="room-id"
              v-model="roomIdToJoin"
              type="text"
              placeholder="Enter room ID to join"
              @keyup.enter="joinRoom"
            />
            <p v-if="joinError" class="text-sm text-red-500">{{ joinError }}</p>
          </div>
          <Button variant="secondary" @click="joinRoom" :disabled="joinLoading">
            {{ joinLoading ? 'Joining...' : 'Join room' }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
