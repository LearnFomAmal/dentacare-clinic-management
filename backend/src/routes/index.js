import { Router } from 'express'
import { MESSAGES } from '../shared/constants/messages.js'
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";

const router = Router()


router.use("/auth", authRoutes);

router.use("/users", userRoutes);


router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: MESSAGES.SERVER_RUNNING
  })
})

export default router