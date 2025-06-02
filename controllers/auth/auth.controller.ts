import { Request, Response } from "express";
import { db } from "../../database/database";
import { hashPassword, comparePassword } from "./auxFunctions";

const registerUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    let user = await db.collection("users").findOne({ username: username });

    if (user) {
      return res.status(403).json({ message: "User already exists" });
    } else {
      let passwordHash = hashPassword(password);

      let response = await db
        .collection("users")
        .insertOne({ username: username, password: passwordHash });

      if (response.acknowledged) {
        return res.status(201).json({ message: "Created" });
      } else {
        return res.status(500);
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error });
  }

  try {
  } catch (error) {}
};

export default {
  registerUser,
};
