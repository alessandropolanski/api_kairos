import express from "express";
import { Router } from "express";
import userController from "../../controllers/users/users.controller";
<<<<<<< HEAD
import { sessionMiddleware } from "../../controllers/auth/auxFunctions";


const router = Router();

router.put("/:pki", sessionMiddleware, userController.updateUser);
=======

const router = Router();

router.put("/:pki", userController.updateUser);
router.get("/me", userController.getUser);
>>>>>>> origin/main

export default router;
