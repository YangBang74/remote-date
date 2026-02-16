import { Router } from 'express'
import { SoundCloudController } from './soundcloud.controller'

const router = Router()

router.get('/search', SoundCloudController.searchTracks)

export default router

