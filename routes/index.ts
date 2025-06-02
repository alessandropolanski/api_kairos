import express from 'express'
const router = express.Router()

import authRoutes from './auth/auth.routes'

router.use('/auth', authRoutes)

export default router;