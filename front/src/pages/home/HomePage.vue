<script setup lang="ts">
import { useRouter } from 'vue-router'
import YouTubeIcon from '@/shared/ui/icons/YouTubeIcon.vue'
import SoundCloudIcon from '@/shared/ui/icons/SoundCloudIcon.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

const router = useRouter()

const blocks = [
  {
    title: 'YouTube',
    description: 'Create a room with a YouTube video or join an existing room by ID.',
    icon: YouTubeIcon,
    route: '/youtube',
  },
  {
    title: 'SoundCloud',
    description: 'Create a SoundCloud room or join one. Choose tracks inside the room.',
    icon: SoundCloudIcon,
    route: '/soundcloud',
  },
]
</script>
<template>
  <div class="p-6">
  <div class="grid md:grid-cols-2 grid-cols-1 gap-6 w-full max-w-4xl">
    <Card
      v-for="block in blocks"
      :key="block.route"
      class="w-full max-w-md cursor-pointer transition-colors hover:bg-muted/50"
      @click="router.push(block.route)"
    >
      <CardHeader class="flex flex-row items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"
        >
          <component :is="block.icon" class="h-5 w-5 shrink-0" />
        </div>
        <div class="flex-1 min-w-0">
          <CardTitle class="text-lg">{{ block.title }}</CardTitle>
          <p class="text-sm text-muted-foreground mt-1">
            {{ block.description }}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" class="w-full" @click.stop="router.push(block.route)">
          Open
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
