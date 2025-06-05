import express from "express";
import { Router } from "express";
import userController from "../../controllers/user/user.controller";

const router = Router();

router.put("/:pki", userController.updateUser);

export default router;
