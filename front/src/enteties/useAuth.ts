import { ref, computed } from 'vue'
import { authAPI } from '@/shared/api/auth.api'
import { tokenService } from '@/shared/api/token.service'

const user = ref<{
  userId: string
  email: string
  firstName?: string
  lastName?: string
  verified: boolean
  createdAt: string
} | null>(null)
const isLoading = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value && tokenService.hasTokens())

  /**
   * Проверить токены и загрузить информацию о пользователе
   */
  const checkAuth = async (): Promise<boolean> => {
    if (!tokenService.hasTokens()) {
      return false
    }

    try {
      isLoading.value = true
      const userData = await authAPI.getMe()
      user.value = userData
      return true
    } catch (error) {
      // Если токены невалидны, очищаем их
      tokenService.clearTokens()
      user.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Выход из системы
   */
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      user.value = null
      tokenService.clearTokens()
    }
  }

  /**
   * Обновить информацию о пользователе
   */
  const refreshUser = async () => {
    if (!isAuthenticated.value) {
      return
    }

    try {
      const userData = await authAPI.getMe()
      user.value = userData
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return {
    user: computed(() => user.value),
    isAuthenticated,
    isLoading: computed(() => isLoading.value),
    checkAuth,
    logout,
    refreshUser,
  }
}
