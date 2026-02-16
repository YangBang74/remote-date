<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Input,
  Button,
  Label,
} from '@/shared/ui'
import { authAPI } from '@/shared/api/auth.api'
import { authStore } from '@/shared/store/auth.store'

const emit = defineEmits<{
  (e: 'register'): void
}>()

const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const handleLogin = async (e: Event) => {
  e.preventDefault()
  error.value = null

  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true

  try {
    const result = await authAPI.login({
      email: email.value,
      password: password.value,
    })

    // Обновляем данные пользователя в store
    await authStore.refreshUser()
    
    console.log('Login successful:', result)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-2xl font-bold">Login</CardTitle>
      <CardDescription>Login to your account to continue</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="flex flex-col items-stretch justify-center gap-4" @submit="handleLogin">
        <div v-if="error" class="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {{ error }}
        </div>
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="Email"
            required
            :disabled="isLoading" />
        </div>
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            variant="password"
            placeholder="Password"
            required
            :disabled="isLoading" />
          <button type="button" class="text-left hover:text-muted-foreground transition">
            Forgot password?
          </button>
        </div>
        <Button type="submit" class="w-full" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </Button>
        <div class="space-y-2">
          <p class="text-center text-sm text-muted-foreground">
            Don't have an account?
            <button
              type="button"
              class="text-foreground hover:text-primary/80 transition"
              @click="emit('register')">
              Register
            </button>
          </p>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
