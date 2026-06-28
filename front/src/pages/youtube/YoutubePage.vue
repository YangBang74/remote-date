<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { roomAPI } from '@/shared/api/room.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Label } from '@/shared/ui/label'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'

const router = useRouter()
const youtubeUrl = ref('')
const roomIdToJoin = ref('')
const createLoading = ref(false)
const joinLoading = ref(false)
const createError = ref<string | null>(null)
const joinError = ref<string | null>(null)

async function createRoom() {
  if (!youtubeUrl.value.trim()) {
    createError.value = 'Please enter a YouTube URL'
    return
  }

  createLoading.value = true
  createError.value = null

  try {
    const room = await roomAPI.createRoom({ youtubeUrl: youtubeUrl.value })
    router.push(`/room/${room.id}`)
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
    await roomAPI.getRoom(id)
    router.push(`/room/${id}`)
  } catch (err: any) {
    joinError.value = err.message || 'Room not found'
  } finally {
    joinLoading.value = false
  }
}
</script>

<template>
  <div class="youtube-page p-6">
    <div class="youtube-page__grid grid md:grid-cols-2 grid-cols-1 gap-6 w-full max-w-4xl">
      <Card class="youtube-page__card youtube-page__card--create flex-1 min-w-0">
        <CardHeader class="youtube-page__card-header">
          <CardTitle class="youtube-page__card-title">Create YouTube room</CardTitle>
        </CardHeader>
        <CardContent class="youtube-page__card-content space-y-4">
          <div class="youtube-page__field space-y-2">
            <Label class="youtube-page__label" for="youtube-url">Paste your YouTube link</Label>
            <Input
              id="youtube-url"
              v-model="youtubeUrl"
              class="youtube-page__input"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              @keyup.enter="createRoom"
            />
            <p v-if="createError" class="youtube-page__error text-sm text-red-500">{{ createError }}</p>
          </div>
          <Button class="youtube-page__submit w-full" @click="createRoom" :disabled="createLoading">
            {{ createLoading ? 'Creating...' : 'Create room' }}
          </Button>
        </CardContent>
      </Card>
      <Card class="youtube-page__card youtube-page__card--join flex-1 min-w-0">
        <CardHeader class="youtube-page__card-header">
          <CardTitle class="youtube-page__card-title">Join YouTube room</CardTitle>
        </CardHeader>
        <CardContent class="youtube-page__card-content space-y-4 flex flex-col justify-between h-full">
          <div class="youtube-page__field space-y-2">
            <Label class="youtube-page__label" for="room-id">Room ID</Label>
            <Input
              id="room-id"
              v-model="roomIdToJoin"
              class="youtube-page__input"
              type="text"
              placeholder="Enter room ID to join"
              @keyup.enter="joinRoom"
            />
            <p v-if="joinError" class="youtube-page__error text-sm text-red-500">{{ joinError }}</p>
          </div>
          <Button
            class="youtube-page__submit youtube-page__submit--join"
            variant="secondary"
            @click="joinRoom"
            :disabled="joinLoading"
          >
            {{ joinLoading ? 'Joining...' : 'Join room' }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
