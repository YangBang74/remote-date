import { API_BASE_URL } from '@/shared/config/api'

export interface SoundCloudTrack {
  id: number
  title: string
  username?: string
  artworkUrl?: string | null
  permalinkUrl: string
  durationMs: number
  streamUrl?: string | null
}

export interface SoundCloudPlaylist {
  id: number
  title: string
  username?: string
  artworkUrl?: string | null
  permalinkUrl: string
  trackCount?: number
  kind: 'playlist'
}

export type SoundCloudSearchItem = SoundCloudTrack | SoundCloudPlaylist

export interface SoundCloudSearchResult {
  items: SoundCloudSearchItem[]
  kind?: 'tracks' | 'playlists'
}

class SoundCloudAPI {
  private baseUrl = `${API_BASE_URL}/soundcloud`

  async searchTracks(
    query: string,
    limit = 5,
    filter: 'tracks' | 'playlists' = 'tracks'
  ): Promise<SoundCloudSearchItem[]> {
    const url = new URL(`${this.baseUrl}/search`)
    url.searchParams.set('q', query)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('filter', filter)

    const res = await fetch(url.toString())

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to search')
    }

    const data = (await res.json()) as SoundCloudSearchResult
    return data.items
  }

  async getPlaylistTracks(playlistId: string | number): Promise<SoundCloudTrack[]> {
    const res = await fetch(`${this.baseUrl}/playlist/${playlistId}`)

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to fetch playlist tracks')
    }

    const data = (await res.json()) as { items: SoundCloudTrack[] }
    return data.items
  }
}

export const soundCloudAPI = new SoundCloudAPI()

