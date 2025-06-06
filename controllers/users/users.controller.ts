import { Request, response, Response } from "express";
import { db } from "../../database/database";
import { hashPassword } from "../auth/auxFunctions";
import { UserModel, userSchema } from "../../models/User";
import { HydratedDocument, InferSchemaType } from "mongoose";

type User = InferSchemaType<typeof userSchema>;
type UserDoc = HydratedDocument<User>;

const updateUser = async (req: Request, res: Response) => {
  const { pki } = req.params;
  const { name, email, role, password, active } = req.body;

  try {

    let user: UserDoc | null = await UserModel.findOne({pki: pki});
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    let newUser: Partial<User> = {
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,  
      password: password && password.length > 0 ? await hashPassword(password) : user.password,
      active: active || user.active,
      updatedAt: new Date(),
      lastModifiedBy: user.lastModifiedBy
    }

    const savedUser = await UserModel.findOneAndUpdate(
      {pki: pki}, 
      {$set: newUser}, 
      {new: true}
    );


    return res.status(200).json({
      message: "User updated",
      user: {
        name: savedUser?.name,
        email: savedUser?.email,
        active: savedUser?.active
      }
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error updating user" });
  }
}

export default {
  updateUser,
};