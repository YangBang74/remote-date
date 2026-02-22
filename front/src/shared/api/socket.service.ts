import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '../config/api'
import type { VideoState } from './room.types'
import type { ChatMessage } from './chat.types'

// Исходящие события
export interface SocketEmitEvents {
  'room:join': (roomId: string) => void
  'room:leave': (roomId: string) => void
  'video:play': (data: { roomId: string; currentTime?: number }) => void
  'video:pause': (data: { roomId: string; currentTime?: number }) => void
  'video:seek': (data: { roomId: string; currentTime: number }) => void
  'video:sync_request': (roomId: string) => void
  'join_room': (roomId: string) => void
  'chat:send': (msg: ChatMessage) => void
  'audio:track_change': (data: {
    roomId: string
    trackUrl: string
    title?: string | null
    artist?: string | null
    artworkUrl?: string | null
  }) => void
}

// Входящие события
export interface SocketOnEvents {
  'video:state': (state: VideoState) => void
  'video:play': (data: { currentTime: number; timestamp: number }) => void
  'video:pause': (data: { currentTime: number; timestamp: number }) => void
  'video:seek': (data: { currentTime: number; timestamp: number }) => void
  'video:sync': (state: VideoState) => void
  'room:user_joined': (data: { roomId: string; participants: number }) => void
  'room:user_left': (data: { roomId: string; participants: number }) => void
  'room:error': (error: { message: string }) => void
  'chat:message': (msg: ChatMessage) => void
  'audio:track_change': (data: {
    trackUrl: string
    title?: string
    artist?: string
    artworkUrl?: string
  }) => void
}

export type SocketEvents = SocketEmitEvents & SocketOnEvents

class SocketService {
  private socket: Socket | null = null

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  on<K extends keyof SocketOnEvents>(
    event: K,
    callback: SocketOnEvents[K]
  ): void {
    if (this.socket) {
      this.socket.on(event, callback as any)
    }
  }

  off<K extends keyof SocketOnEvents>(
    event: K,
    callback?: SocketOnEvents[K]
  ): void {
    if (this.socket) {
      this.socket.off(event, callback as any)
    }
  }

  emit<K extends keyof SocketEmitEvents>(
    event: K,
    ...args: Parameters<SocketEmitEvents[K]>
  ): void {
    if (this.socket) {
      this.socket.emit(event, ...args)
    }
  }
}

export const socketService = new SocketService()
