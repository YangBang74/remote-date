import type { Request, Response } from 'express'

const SOUNDCLOUD_API_URL = 'https://api-v2.soundcloud.com'

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

export const SoundCloudController = {
  async searchTracks(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || ''
      const limit = parseInt((req.query.limit as string) || '5', 10)

      if (!q.trim()) {
        return res.status(400).json({ error: 'Query q is required' })
      }

      const clientId = process.env.SOUNDCLOUD_CLIENT_ID
      if (!clientId) {
        return res
          .status(500)
          .json({ error: 'SOUNDCLOUD_CLIENT_ID is not configured on the server' })
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
          return {
            id: track.id,
            title: track.title,
            username: track.user?.username,
            artworkUrl: track.artwork_url || track.user?.avatar_url || null,
            permalinkUrl: track.permalink_url,
            durationMs: track.duration,
            streamUrl,
          }
        })
      )

      res.json({ items })
    } catch (error: any) {
      console.error('SoundCloud search error', error)
      res.status(500).json({ error: error.message || 'Failed to search SoundCloud tracks' })
    }
  },
}

