<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
</script>
<template>
  <div class="flex min-h-screen w-full flex-col">
    <header
      class="flex justify-between py-8 md:h-14 h-12 border-b border-border shrink-0 items-center gap-2 px-4">
      <h1 class="text-2xl font-bold uppercase">Remote Date</h1>
      <ThemeToggle />
    </header>
    <div class="flex flex-1 flex-col">
      <RouterView class="flex-1" />
    </div>
  </div>
</template>
