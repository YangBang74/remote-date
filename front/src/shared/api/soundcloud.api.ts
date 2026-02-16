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

export interface SoundCloudSearchResult {
  items: SoundCloudTrack[]
}

class SoundCloudAPI {
  private baseUrl = `${API_BASE_URL}/soundcloud`

  async searchTracks(query: string, limit = 5): Promise<SoundCloudTrack[]> {
    const url = new URL(`${this.baseUrl}/search`)
    url.searchParams.set('q', query)
    url.searchParams.set('limit', String(limit))

    const res = await fetch(url.toString())

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to search tracks')
    }

    const data = (await res.json()) as SoundCloudSearchResult
    return data.items
  }
}

export const soundCloudAPI = new SoundCloudAPI()

