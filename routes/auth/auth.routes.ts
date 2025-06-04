import express from 'express';
const router = express.Router();
import authController from '../../controllers/auth/auth.controller';

// Auth Routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logoutUser);

// Session Routes
router.delete("/sessions", authController.invalidateUserSessions);
router.get("/session", authController.getUserActiveSession);

export default router;