<script setup lang="ts">
import { ref } from 'vue'
import { Login, Register } from './ui'
const activeTab = ref<'login' | 'register'>('login')

</script>
<template>
  <div class="flex items-center justify-center h-full">
    <Login v-if="activeTab === 'login'" @register="activeTab = 'register'" />
    <Register v-if="activeTab === 'register'" @login="activeTab = 'login'" />
  </div>
</template>
