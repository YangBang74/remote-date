export type RoomType = 'youtube' | 'soundcloud'

export interface VideoRoom {
  id: string
  type: RoomType
  youtubeUrl?: string
  youtubeVideoId?: string
  soundcloudUrl?: string
  createdAt: Date
  currentTime: number
  isPlaying: boolean
  participants: number
}

export interface CreateRoomDto {
  youtubeUrl?: string
  soundcloudUrl?: string
  type?: RoomType
}

export interface VideoState {
  currentTime: number
  isPlaying: boolean
  timestamp: number // Время сервера для синхронизации
}

export interface VideoEvent {
  type: 'play' | 'pause' | 'seek'
  currentTime?: number
  timestamp: number
}
