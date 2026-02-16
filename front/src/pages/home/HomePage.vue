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
const loading = ref(false)
const error = ref<string | null>(null)

async function createRoom() {
  if (!youtubeUrl.value.trim()) {
    error.value = 'Please enter a YouTube URL'
    return
  }

  loading.value = true
  error.value = null

  try {
    const room = await roomAPI.createRoom({ youtubeUrl: youtubeUrl.value })
    router.push(`/room/${room.id}`)
  } catch (err: any) {
    error.value = err.message || 'Failed to create room'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <div class="p-6">
    <Card>
      <CardHeader>
        <CardTitle>Watching from Youtube</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="youtube-url">Paste your YouTube link</Label>
          <Input
            id="youtube-url"
            v-model="youtubeUrl"
            type="text"
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            @keyup.enter="createRoom"
          />
          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        </div>
        <Button @click="createRoom" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create room' }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
