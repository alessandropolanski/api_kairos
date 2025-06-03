import express from 'express';
const router = express.Router();
import userController from '../../controllers/users/users.controller';


router.put("/updateUser/:id", userController.updateUser);

// router.delete("/deleteUser", userController.deleteUser);
// router.get("/getUsers", userController.getUsers);
// router.get("/getUser/:id", userController.getUser);


export default router;