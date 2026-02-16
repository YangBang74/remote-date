export interface VideoRoom {
  id: string
  youtubeUrl: string
  youtubeVideoId: string
  createdAt: string
  currentTime: number
  isPlaying: boolean
  participants: number
}

export interface CreateRoomDto {
  youtubeUrl: string
}

export interface VideoState {
  currentTime: number
  isPlaying: boolean
  timestamp: number
}
