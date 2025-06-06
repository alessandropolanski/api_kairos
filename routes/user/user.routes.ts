import express from "express";
import { Router } from "express";
import userController from "../../controllers/users/users.controller";
import { sessionMiddleware } from "../../controllers/auth/auxFunctions";


const router = Router();

router.put("/:pki", sessionMiddleware, userController.updateUser);

export default router;
