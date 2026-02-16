const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

class TokenService {
  /**
   * Сохранить токены в localStorage
   */
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  /**
   * Получить access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  /**
   * Получить refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Удалить токены
   */
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Проверить, есть ли сохраненные токены
   */
  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken())
  }
}

export const tokenService = new TokenService()
