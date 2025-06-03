import express from 'express';
const router = express.Router();
import authController from '../../controllers/auth/auth.controller';

router.post("/registerUser", authController.registerUser);
router.post("/loginUser", authController.loginUser);

export default router;