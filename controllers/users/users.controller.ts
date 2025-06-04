import { InferSchemaType, HydratedDocument } from "mongoose";
import { Request, Response } from "express";
import { db } from "../../database/database";
import { hashPassword } from "../auth/auxFunctions";
import { z } from "zod";
import { UserModel, User, UserDoc } from "../../models/User";

const updateUser = async (req: Request, res: Response) => {
  const { pki } = req.params;
  const { name, email, role, password, active } = req.body;

  try {

    let user: UserDoc | null = await UserModel.findOne({ pki: pki });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let newUser: Partial<User> = {
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      password: password || user.password,
      active: active || user.active
    }

    let response = await db
      .collection("users")
      .updateOne(
        { pki: pki },
        { $set: newUser }
      );

    if (response.acknowledged) {
      console.log(`User saved: ${user}`);
      return res.status(200).json({ message: "User updated" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error updating user" });
  }
}

export default {
  updateUser,
  //   deleteUser,
  //   getUsers,
  //   getUser,
};

