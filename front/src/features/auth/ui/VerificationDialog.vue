<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { authAPI } from '@/shared/api/auth.api'

interface Props {
  open: boolean
  email: string
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'verified', userId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const codeInputs = ref<string[]>(['', '', '', '', '', ''])
const inputRefs = ref<(HTMLInputElement | null)[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

watch(
  () => props.open,
  (newValue) => {
    if (newValue) {
      codeInputs.value = ['', '', '', '', '', '']
      error.value = null
      nextTick(() => {
        inputRefs.value[0]?.focus()
      })
    }
  }
)

const getCode = (): string => {
  return codeInputs.value.join('')
}

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '').slice(0, 1)

  codeInputs.value[index] = value
  error.value = null

  // Переход к следующему полю
  if (value && index < 5) {
    nextTick(() => {
      inputRefs.value[index + 1]?.focus()
    })
  }

  // Автоматическая проверка, если все поля заполнены
  if (getCode().length === 6) {
    nextTick(() => {
      handleVerify()
    })
  }
}

const handleKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !codeInputs.value[index] && index > 0) {
    // Если поле пустое и нажат Backspace, переходим к предыдущему полю
    nextTick(() => {
      inputRefs.value[index - 1]?.focus()
    })
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    inputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < 5) {
    event.preventDefault()
    inputRefs.value[index + 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || ''

  if (pastedData.length > 0) {
    for (let i = 0; i < 6; i++) {
      codeInputs.value[i] = pastedData[i] || ''
    }

    // Фокус на следующее пустое поле или последнее заполненное
    const nextEmptyIndex = codeInputs.value.findIndex((val) => !val)
    const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5)

    nextTick(() => {
      inputRefs.value[focusIndex]?.focus()
    })

    // Автоматическая проверка, если все поля заполнены
    if (getCode().length === 6) {
      nextTick(() => {
        handleVerify()
      })
    }
  }
}

const handleVerify = async () => {
  const code = getCode()

  if (code.length !== 6) {
    error.value = 'Please enter a 6-digit code'
    toast.error('Please enter a 6-digit code')
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const result = await authAPI.registerCheck({
      email: props.email,
      code: code,
    })

    emit('verified', result.userId)
    emit('update:open', false)
    toast.success('Email verified')
  } catch (err: any) {
    const message = err.message || 'Invalid verification code'
    error.value = message
    toast.error(message)
    // Очищаем все поля при ошибке
    codeInputs.value = ['', '', '', '', '', '']
    nextTick(() => {
      inputRefs.value[0]?.focus()
    })
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  emit('update:open', false)
}
</script>

<template>
  <Dialog class="verification-dialog" :open="open" @update:open="handleClose">
    <DialogContent class="verification-dialog__content sm:max-w-md">
      <DialogHeader class="verification-dialog__header">
        <DialogTitle class="verification-dialog__title">Verify Your Email</DialogTitle>
        <DialogDescription class="verification-dialog__description">
          We've sent a verification code to <strong class="verification-dialog__email">{{ email }}</strong
          >. Please enter the code below.
        </DialogDescription>
      </DialogHeader>

      <div class="verification-dialog__body space-y-4 py-4">
        <div class="verification-dialog__field space-y-2">
          <Label class="verification-dialog__label">Verification Code</Label>
          <div
            class="verification-dialog__code-inputs flex items-center justify-between gap-2"
            @paste.prevent="handlePaste"
          >
            <input
              v-for="(_, index) in codeInputs"
              :key="index"
              :ref="(el) => (inputRefs[index] = el as HTMLInputElement)"
              v-model="codeInputs[index]"
              class="verification-dialog__code-digit w-12 h-12 text-center text-2xl font-bold border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              type="text"
              inputmode="numeric"
              maxlength="1"
              :disabled="isLoading"
              @input="(e) => handleInput(index, e)"
              @keydown="(e) => handleKeyDown(index, e)"
              @keyup.enter="handleVerify"
            />
          </div>
          <p v-if="error" class="verification-dialog__error text-sm text-left text-destructive mt-2">
            {{ error }}
          </p>
        </div>
      </div>

      <DialogFooter class="verification-dialog__footer">
        <Button
          class="verification-dialog__cancel"
          variant="outline"
          :disabled="isLoading"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          class="verification-dialog__submit"
          :disabled="isLoading || getCode().length !== 6"
          @click="handleVerify"
        >
          {{ isLoading ? 'Verifying...' : 'Verify' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
