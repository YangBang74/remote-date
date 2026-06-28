const defaultApiUrl = import.meta.env.DEV
  ? '/api'
  : 'http://localhost:5001/api'

const defaultSocketUrl = (): string => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
  }
  return 'ws://localhost:5001/ws'
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl()
