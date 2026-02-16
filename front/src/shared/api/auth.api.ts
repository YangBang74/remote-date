import { API_BASE_URL } from '../config/api'
import { tokenService } from './token.service'
import type {
  RegisterDto,
  RegisterCheckDto,
  LoginDto,
  RegisterResponse,
  RegisterCheckResponse,
  LoginResponse,
  RefreshTokenResponse,
} from './auth.types'

class AuthAPI {
  private baseUrl = `${API_BASE_URL}/auth`
  private isRefreshing = false
  private refreshPromise: Promise<RefreshTokenResponse> | null = null

  /**
   * Получить заголовки с токеном
   */
  private getAuthHeaders(): HeadersInit {
    const accessToken = tokenService.getAccessToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    return headers
  }

  /**
   * Обновить токены
   */
  async refreshTokens(): Promise<RefreshTokenResponse> {
    // Если уже идет обновление, возвращаем существующий промис
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    const refreshToken = tokenService.getRefreshToken()

    if (!refreshToken) {
      this.isRefreshing = false
      throw new Error('No refresh token available')
    }

    this.refreshPromise = fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json()
          tokenService.clearTokens()
          throw new Error(error.error || 'Failed to refresh token')
        }
        return response.json()
      })
      .then((data: RefreshTokenResponse) => {
        tokenService.setTokens(data.accessToken, data.refreshToken)
        return data
      })
      .finally(() => {
        this.isRefreshing = false
        this.refreshPromise = null
      })

    return this.refreshPromise
  }

  /**
   * Выполнить запрос с автоматическим обновлением токена при ошибке 401
   */
  private async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    })

    // Если получили 401, пытаемся обновить токен
    if (response.status === 401) {
      try {
        await this.refreshTokens()
        // Повторяем запрос с новым токеном
        response = await fetch(url, {
          ...options,
          headers: {
            ...this.getAuthHeaders(),
            ...options.headers,
          },
        })
      } catch (error) {
        // Если не удалось обновить, очищаем токены
        tokenService.clearTokens()
        throw error
      }
    }

    return response
  }

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to register')
    }

    return response.json()
  }

  async registerCheck(dto: RegisterCheckDto): Promise<RegisterCheckResponse> {
    const response = await fetch(`${this.baseUrl}/register-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to verify code')
    }

    const data = await response.json()
    // Сохраняем токены после успешной регистрации
    tokenService.setTokens(data.accessToken, data.refreshToken)
    return data
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    // Сохраняем токены после успешного входа
    tokenService.setTokens(data.accessToken, data.refreshToken)
    return data
  }

  async refresh(): Promise<RefreshTokenResponse> {
    return this.refreshTokens()
  }

  async logout(): Promise<void> {
    const refreshToken = tokenService.getRefreshToken()

    try {
      if (refreshToken) {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      tokenService.clearTokens()
    }
  }

  /**
   * Получить информацию о текущем пользователе
   */
  async getMe(): Promise<{
    userId: string
    email: string
    firstName?: string
    lastName?: string
    verified: boolean
    createdAt: string
  }> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/me`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get user info')
    }

    return response.json()
  }
}

export const authAPI = new AuthAPI()
