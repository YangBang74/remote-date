<script setup>
import { useColorMode } from '@vueuse/core'
import { PhSun, PhMoon } from '@phosphor-icons/vue'
import { Button } from '@/shared/ui/button'

const mode = useColorMode()

const toggleTheme = () => {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <Button variant="ghost" size="icon" @click="toggleTheme">
    <PhSun v-if="mode === 'dark'" class="h-5 w-5" />
    <PhMoon v-else class="h-5 w-5" />
  </Button>
</template>
