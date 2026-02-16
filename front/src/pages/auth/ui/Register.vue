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
  VerificationDialog,
} from '@/shared/ui'
import { authAPI } from '@/shared/api/auth.api'
import { authStore } from '@/shared/store/auth.store'

const emit = defineEmits<{
  (e: 'login'): void
}>()

const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const showVerificationDialog = ref(false)
const registeredEmail = ref('')

const handleRegister = async (e: Event) => {
  e.preventDefault()
  error.value = null

  // Валидация
  if (!email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  isLoading.value = true

  try {
    await authAPI.register({
      email: email.value,
      password: password.value,
    })
    
    registeredEmail.value = email.value
    showVerificationDialog.value = true
  } catch (err: any) {
    error.value = err.message || 'Registration failed'
  } finally {
    isLoading.value = false
  }
}

const handleVerified = async (userId: string) => {
  // После успешной верификации обновляем данные пользователя в store
  console.log('User verified:', userId)
  await authStore.refreshUser()
  router.push('/')
}

const handleDialogClose = () => {
  showVerificationDialog.value = false
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-2xl font-bold">Register</CardTitle>
      <CardDescription>Register to your account to continue</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="flex flex-col items-stretch justify-center gap-4" @submit="handleRegister">
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
            :disabled="isLoading"
          />
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
            :disabled="isLoading"
          />
        </div>
        <div class="space-y-2">
          <Label for="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            variant="password"
            placeholder="Confirm Password"
            required
            :disabled="isLoading"
          />
        </div>
        <Button type="submit" class="w-full" :disabled="isLoading">
          {{ isLoading ? 'Registering...' : 'Register' }}
        </Button>
        <div class="space-y-2">
          <p class="text-center text-sm text-muted-foreground">
            Already have an account?
            <button
              type="button"
              class="text-foreground hover:text-primary/80 transition"
              @click="emit('login')">
              Login
            </button>
          </p>
        </div>
      </form>
    </CardContent>
  </Card>

  <VerificationDialog
    :open="showVerificationDialog"
    :email="registeredEmail"
    @update:open="handleDialogClose"
    @verified="handleVerified"
  />
</template>
