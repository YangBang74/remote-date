import { Router } from 'express'
import { SoundCloudController } from './soundcloud.controller'

const router = Router()

router.get('/search', SoundCloudController.searchTracks)
router.get('/playlist/:id', SoundCloudController.getPlaylistTracks)

export default router

