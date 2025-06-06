import express from "express";
import { Router } from "express";
import userController from "../../controllers/users/users.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
const router = Router();

router.put("/:pki", authMiddleware, userController.updateUser);
router.get("/me", authMiddleware, userController.getUser);

export default router;
