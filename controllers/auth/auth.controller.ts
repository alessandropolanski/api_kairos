import { Request, Response } from "express";
import { db } from "../../database/database";
import { hashPassword, comparePassword } from "./auxFunctions";

const registerUser = async (req: Request, res: Response) => {
  const { pki, name, email, password, role } = req.body;

  try {
    let user = await db.collection("users").findOne({ email: email });

    if (user) {
      return res.status(403).json({ message: "User already exists" });
    } else {
      const passwordHash = await hashPassword(password);
      const currentDate = new Date();

      const newUser = {
        pki,
        name,
        email,
        password: passwordHash,
        role,
        active: true,
        createdAt: currentDate,
        updatedAt: currentDate,
        lastModifiedBy: 'system'
      };


      let response = await db
        .collection("users")
        .insertOne(newUser);

      if (response.acknowledged) {
        return res.status(201).json({ message: "Created" });
      } else {
        return res.status(500).json({ message: "Failed to create user" });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

const loginUser = async (req: Request, res: Response) => {
    const { pki, password } = req.body;

    try {
        
    } catch (error) {
        
    }
}

export default {
  registerUser,
}