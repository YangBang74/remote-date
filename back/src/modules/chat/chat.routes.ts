import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware'
import { ChatController } from './chat.controller'

const router = Router();

router.use(authMiddleware)

router.get('/:room', ChatController.getRoomMessages)

export default router
