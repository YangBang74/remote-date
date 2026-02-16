import { ref, computed, type Ref } from 'vue'
import { authAPI } from '../api/auth.api'
import { tokenService } from '../api/token.service'
import { useRouter } from 'vue-router'

const router = useRouter()

export interface User {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  verified: boolean
  createdAt: string
}

// Глобальное состояние пользователя
const user: Ref<User | null> = ref(null)
const isLoading = ref(false)
const isInitialized = ref(false)

export const authStore = {
  /**
   * Получить данные пользователя
   */
  user: computed(() => user.value),

  /**
   * Проверить, авторизован ли пользователь
   */
  isAuthenticated: computed(() => !!user.value && tokenService.hasTokens()),

  /**
   * Проверить, инициализирован ли store
   */
  isInitialized: computed(() => isInitialized.value),

  /**
   * Состояние загрузки
   */
  isLoading: computed(() => isLoading.value),

  /**
   * Инициализация - проверка токенов и загрузка данных пользователя
   */
  async initialize(): Promise<boolean> {
    if (isInitialized.value) {
      return !!user.value
    }

    if (!tokenService.hasTokens()) {
      isInitialized.value = true
      router.push('/auth')
      return false
    }

    try {
      isLoading.value = true
      const userData = await authAPI.getMe()
      user.value = userData
      isInitialized.value = true
      return true
    } catch (error) {
      // Если токены невалидны, очищаем их
      tokenService.clearTokens()
      user.value = null
      isInitialized.value = true
      return false
    } finally {
      isLoading.value = false
    }
  },

  /**
   * Установить данные пользователя
   */
  setUser(userData: User | null): void {
    user.value = userData
  },

  /**
   * Обновить данные пользователя
   */
  async refreshUser(): Promise<void> {
    if (!tokenService.hasTokens()) {
      user.value = null
      return
    }

    try {
      const userData = await authAPI.getMe()
      user.value = userData
    } catch (error) {
      // Если не удалось обновить, возможно токены истекли
      tokenService.clearTokens()
      user.value = null
    }
  },

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    try {
      await authAPI.logout()
    } catch (error) {
    } finally {
      user.value = null
      tokenService.clearTokens()
      isInitialized.value = false
    }
  },

  /**
   * Сброс состояния (для тестирования)
   */
  reset(): void {
    user.value = null
    isLoading.value = false
    isInitialized.value = false
  },
}
