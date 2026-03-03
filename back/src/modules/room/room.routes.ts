import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware'
import { RoomController } from './room.controller'

const router = Router()

router.use(authMiddleware)

router.post('/', RoomController.createRoom)
router.get('/:id', RoomController.getRoom)
router.get('/:id/state', RoomController.getRoomState)

export default router
