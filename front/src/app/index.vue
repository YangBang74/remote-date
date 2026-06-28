<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { authStore } from '@/entities/user'
import { Toaster } from '@/shared/ui/sonner'

// Инициализируем auth store при загрузке приложения
onMounted(async () => {
  console.log('[App] Initializing auth store...')
  await authStore.initialize()
})
</script>

<template>
  <RouterView />
  <Toaster />
</template>
