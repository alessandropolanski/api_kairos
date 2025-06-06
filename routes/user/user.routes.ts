import express from "express";
import { Router } from "express";
import userController from "../../controllers/users/users.controller";

const router = Router();

router.put("/:pki", userController.updateUser);
router.get("/me", userController.getUser);

export default router;
