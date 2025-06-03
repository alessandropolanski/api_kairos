import { Request, Response } from "express";
import { User } from "../../models/User";
import { db } from "../../database/database";
import { hashPassword } from "../auth/auxFunctions";



const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params
    const { username, password } = req.body;

  try {
    let user = await db.collection("users").findOne({id: id});
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    user.username = username;
    let passwordHash = hashPassword(password);
    user.password = passwordHash;
    
    await user.save();
    return res.status(200).json({ message: "User updated" });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
}

// const deleteUser = async (req: Request, res: Response) => {
//     const { id } = req.params
//       const { username, password } = req.body;

// };


export default {
  updateUser,
//   deleteUser,
//   getUsers,
//   getUser,
};
