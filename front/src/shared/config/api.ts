export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// WebSocket endpoint of Rust backend
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5000/ws'
