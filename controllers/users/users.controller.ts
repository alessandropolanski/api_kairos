import { Request, Response } from "express";
import { db } from "../../database/database";
import { hashPassword } from "../auth/auxFunctions";
import { z } from "zod";

const UserSchema = z.object({
  name: z.string().min(1).trim().toLowerCase(),
  email: z.string().email().trim().toLowerCase(),
  role: z.string().min(1).trim().toLowerCase(),
  password: z.string().min(1).trim(),
  active: z.boolean(),
});

const updateUser = async (req: Request, res: Response) => {
  const { pki } = req.params;
  const { name, email, role, password, active } = req.body;
  
  try {
    
    let user = await db.collection("users").findOne({pki: pki});
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
  
    const { success } = UserSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ message: "Invalid user data" });
    }
    
    const sameName = name === user.name;
    const sameEmail = email === user.email;
    const sameRole = role === user.role;
    const samePassword = password === user.password;
    const sameActive = active === user.active;

    if (!sameName) {
      user.name = name;
    }
    if (!sameEmail) {
      user.email = email;
    }
    if (!sameRole) {
      user.role = role;
    }
    if (!samePassword) {
      user.password = await hashPassword(password);
    }
    if (!sameActive) {
      user.active = active;
    }
    if (sameName && sameEmail && sameRole && samePassword && sameActive) {
      return res.status(400).json({ message: "No changes made" });
    }

   let response = await db
    .collection("users")
    .updateOne(
        {pki: pki}, 
        {$set: user}
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
