import { Router } from 'express'
import { MESSAGES } from '../shared/constants/messages.js'

const router = Router()

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: MESSAGES.SERVER_RUNNING
  })
})

export default router