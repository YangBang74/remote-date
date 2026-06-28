<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
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
import { authStore } from '@/entities/user'
import VerificationDialog from './VerificationDialog.vue'

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
    toast.error('Please fill in all fields')
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    toast.error('Passwords do not match')
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    toast.error('Password must be at least 6 characters')
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
    toast.info('Verification code sent to your email')
  } catch (err: any) {
    const message = err.message || 'Registration failed'
    error.value = message
    toast.error(message)
  } finally {
    isLoading.value = false
  }
}

const handleVerified = async (_userId: string) => {
  await authStore.refreshUser()
  toast.success('Account verified. Welcome!')
  router.push('/')
}

const handleDialogClose = () => {
  showVerificationDialog.value = false
}
</script>

<template>
  <Card class="register-form w-full max-w-md">
    <CardHeader class="register-form__header">
      <CardTitle class="register-form__title text-2xl font-bold">Register</CardTitle>
      <CardDescription class="register-form__description">Register to your account to continue</CardDescription>
    </CardHeader>
    <CardContent class="register-form__content">
      <form class="register-form__form flex flex-col items-stretch justify-center gap-4" @submit="handleRegister">
        <div v-if="error" class="register-form__error p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {{ error }}
        </div>
        <div class="register-form__field register-form__field--email space-y-2">
          <Label class="register-form__label" for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            class="register-form__input register-form__input--email"
            type="email"
            placeholder="Email"
            required
            :disabled="isLoading"
          />
        </div>
        <div class="register-form__field register-form__field--password space-y-2">
          <Label class="register-form__label" for="password">Password</Label>
          <Input
            id="password"
            v-model="password"
            class="register-form__input register-form__input--password"
            type="password"
            variant="password"
            placeholder="Password"
            required
            :disabled="isLoading"
          />
        </div>
        <div class="register-form__field register-form__field--confirm space-y-2">
          <Label class="register-form__label" for="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            v-model="confirmPassword"
            class="register-form__input register-form__input--confirm"
            type="password"
            variant="password"
            placeholder="Confirm Password"
            required
            :disabled="isLoading"
          />
        </div>
        <Button type="submit" class="register-form__submit w-full" :disabled="isLoading">
          {{ isLoading ? 'Registering...' : 'Register' }}
        </Button>
        <div class="register-form__footer space-y-2">
          <p class="register-form__switch text-center text-sm text-muted-foreground">
            Already have an account?
            <button
              type="button"
              class="register-form__switch-link text-foreground hover:text-primary/80 transition"
              @click="emit('login')"
            >
              Login
            </button>
          </p>
        </div>
      </form>
    </CardContent>
  </Card>

  <VerificationDialog
    class="register-form__verification"
    :open="showVerificationDialog"
    :email="registeredEmail"
    @update:open="handleDialogClose"
    @verified="handleVerified"
  />
</template>
