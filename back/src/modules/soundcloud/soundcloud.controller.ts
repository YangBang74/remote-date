import type { Request, Response } from 'express'

const SOUNDCLOUD_API_URL = 'https://api-v2.soundcloud.com'

async function fetchFullTrack(trackId: number, clientId: string): Promise<any | null> {
  try {
    const url = `${SOUNDCLOUD_API_URL}/tracks/${trackId}?client_id=${clientId}`
    const resp = await fetch(url)
    if (!resp.ok) return null
    return await resp.json()
  } catch {
    return null
  }
}

function isCompactTrack(track: any): boolean {
  return !track.media && !track.permalink_url
}

async function resolveStreamUrlFromMedia(media: any, clientId: string): Promise<string | null> {
  if (!media || !Array.isArray(media.transcodings)) return null

  // Ищем прогрессивный MP3, который можно отдать напрямую в <audio>
  const progressive = media.transcodings.find(
    (t: any) => t.format?.protocol === 'progressive'
  )

  if (!progressive?.url) return null

  // Этот URL возвращает JSON с финальным URL стрима
  const url = new URL(progressive.url)
  url.searchParams.set('client_id', clientId)

  const resp = await fetch(url.toString())
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    console.error('SoundCloud progressive resolve error', resp.status, text)
    return null
  }

  try {
    const data = await resp.json()
    if (data && typeof data.url === 'string') {
      return data.url
    }
  } catch (e) {
    console.error('Failed to parse SoundCloud progressive response', e)
  }

  return null
}

function trackToItem(track: any, streamUrl: string | null) {
  return {
    id: track.id,
    title: track.title,
    username: track.user?.username,
    artworkUrl: track.artwork_url || track.user?.avatar_url || null,
    permalinkUrl: track.permalink_url,
    durationMs: track.duration,
    streamUrl,
  }
}

export const SoundCloudController = {
  async searchTracks(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || ''
      const limit = parseInt((req.query.limit as string) || '5', 10)
      const filter = (req.query.filter as string) || 'tracks'

      if (!q.trim()) {
        return res.status(400).json({ error: 'Query q is required' })
      }

      const clientId = process.env.SOUNDCLOUD_CLIENT_ID
      if (!clientId) {
        return res
          .status(500)
          .json({ error: 'SOUNDCLOUD_CLIENT_ID is not configured on the server' })
      }

      if (filter === 'playlists') {
        const url = new URL(`${SOUNDCLOUD_API_URL}/search/playlists`)
        url.searchParams.set('q', q)
        url.searchParams.set('client_id', clientId)
        url.searchParams.set('limit', String(limit))

        const response = await fetch(url.toString())
        if (!response.ok) {
          const text = await response.text()
          console.error('SoundCloud playlists API error', response.status, text)
          return res.status(502).json({ error: 'Failed to fetch playlists from SoundCloud' })
        }

        const data = await response.json()
        const collection: any[] = data.collection || []
        const playlists = collection.map((p: any) => ({
          id: p.id,
          title: p.title,
          username: p.user?.username,
          artworkUrl: p.artwork_url || p.user?.avatar_url || null,
          permalinkUrl: p.permalink_url,
          trackCount: p.track_count ?? 0,
          kind: 'playlist',
        }))

        return res.json({ items: playlists, kind: 'playlists' })
      }

      const url = new URL(`${SOUNDCLOUD_API_URL}/search/tracks`)
      url.searchParams.set('q', q)
      url.searchParams.set('client_id', clientId)
      url.searchParams.set('limit', String(limit))

      const response = await fetch(url.toString())

      if (!response.ok) {
        const text = await response.text()
        console.error('SoundCloud API error', response.status, text)
        return res.status(502).json({ error: 'Failed to fetch tracks from SoundCloud' })
      }

      const data = await response.json()
      const collection: any[] = data.collection || []

      const items = await Promise.all(
        collection.map(async (track: any) => {
          const streamUrl = await resolveStreamUrlFromMedia(track.media, clientId)
          return trackToItem(track, streamUrl)
        })
      )

      res.json({ items, kind: 'tracks' })
    } catch (error: any) {
      console.error('SoundCloud search error', error)
      res.status(500).json({ error: error.message || 'Failed to search SoundCloud tracks' })
    }
  },

  async getPlaylistTracks(req: Request, res: Response) {
    try {
      const id = req.params.id
      const clientId = process.env.SOUNDCLOUD_CLIENT_ID

      if (!clientId) {
        return res
          .status(500)
          .json({ error: 'SOUNDCLOUD_CLIENT_ID is not configured on the server' })
      }

      const allTracks: any[] = []
      const limitPerPage = 200
      let nextUrl: string | null = `${SOUNDCLOUD_API_URL}/playlists/${id}?client_id=${clientId}&representation=full&linked_partitioning=1&limit=${limitPerPage}`

      while (nextUrl) {
        const fetchResponse = await fetch(nextUrl)
        if (!fetchResponse.ok) {
          const text = await fetchResponse.text()
          console.error('SoundCloud playlist API error', fetchResponse.status, text)
          return res.status(502).json({ error: 'Failed to fetch playlist from SoundCloud' })
        }

        const data = (await fetchResponse.json()) as any
        let batch: any[] = []
        let next: string | null = null

        if (Array.isArray(data.tracks)) {
          batch = data.tracks
        } else if (data.tracks && Array.isArray(data.tracks.collection)) {
          batch = data.tracks.collection
          next = data.tracks.next_href || null
        } else if (Array.isArray(data.collection)) {
          batch = data.collection
          next = data.next_href || null
        }

        allTracks.push(...batch)
        nextUrl =
          next && typeof next === 'string'
            ? next.includes('client_id')
              ? next
              : `${next}${next.includes('?') ? '&' : '?'}client_id=${clientId}`
            : null
      }

      const items = await Promise.all(
        allTracks.map(async (track: any) => {
          let fullTrack = track
          if (isCompactTrack(track) && track.id) {
            const fetched = await fetchFullTrack(track.id, clientId)
            if (fetched) fullTrack = fetched
          }
          const streamUrl = await resolveStreamUrlFromMedia(fullTrack.media, clientId)
          return trackToItem(fullTrack, streamUrl)
        })
      )

      res.json({ items })
    } catch (error: any) {
      console.error('SoundCloud playlist error', error)
      res.status(500).json({ error: error.message || 'Failed to fetch playlist tracks' })
    }
  },
}

