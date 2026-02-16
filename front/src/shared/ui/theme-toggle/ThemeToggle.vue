<script setup>
import { useColorMode } from '@vueuse/core'
import { Sun, Moon } from 'lucide-vue-next'
import { Button } from '@/shared/ui/button'

const mode = useColorMode()

const toggleTheme = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <Button variant="ghost" size="icon" @click="toggleTheme">
    <Sun v-if="mode === 'dark'" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
  </Button>
</template>
