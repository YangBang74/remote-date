import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware'
import { SoundCloudController } from './soundcloud.controller'

const router = Router()

router.use(authMiddleware)

router.get('/search', SoundCloudController.searchTracks)
router.get('/playlist/:id', SoundCloudController.getPlaylistTracks)

export default router

