import { Request, Response } from "express";
import { db } from "../../database/database";
import { hashPassword, comparePassword } from "./auxFunctions";
import { SessionModel } from "../../models/Session";
import jwt from "jsonwebtoken";

const registerUser = async (req: Request, res: Response) => {
  const { pki, name, email, password, role } = req.body;

  try {
    let user = await db.collection("user").findOne({ pki: pki });

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
        .collection("user")
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
        let user = await db.collection("user").findOne({ pki: pki });

        if (!user) {
          return res.status(401).json({ message: "User not found" });
        } 

        const compare = await comparePassword(password, user.password);

        if (!compare) {
          return res.status(401).json({ message: "Invalid password" });
        }

        // Invalidar todas as sessões anteriores do usuário
        await SessionModel.updateMany(
          { userPki: user.pki },
          { valid: false }
        );

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Sessão expira em 24 horas

        const newSession = new SessionModel({
          userPki: user.pki,
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          expiresAt: expiresAt
        });

        const savedSession = await newSession.save();

        const token = jwt.sign({ 
          pki: user.pki, 
          sessionId: savedSession.sessionId 
        }, process.env.JWT_SECRET || 'secret');

        return res.status(200).json({ 
          message: "Login successful", 
          token,
          sessionId: savedSession.sessionId 
        });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
}

const logoutUser = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: "Token not provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        
        if (!decoded.sessionId) {
            return res.status(400).json({ message: "Invalid token format" });
        }

        // Invalidar a sessão
        await SessionModel.findOneAndUpdate(
            { sessionId: decoded.sessionId },
            { valid: false }
        );

        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return res.status(500).json({ message: error });
    }
}

const validateSession = async (sessionId: string): Promise<boolean> => {
    try {
        const session = await SessionModel.findOne({ 
            sessionId: sessionId,
            valid: true,
            expiresAt: { $gt: new Date() }
        });

        return !!session;
    } catch (error) {
        return false;
    }
}

const getUserActiveSession = async (userPki: string) => {
    try {
        const session = await SessionModel.findOne({ 
            userPki: userPki,
            valid: true,
            expiresAt: { $gt: new Date() }
        });

        return session;
    } catch (error) {
        return null;
    }
}

const invalidateUserSessions = async (userPki: string): Promise<boolean> => {
    try {
        await SessionModel.updateMany(
          { userPki: userPki },
          { valid: false }
        );
        return true;
    } catch (error) {
        return false;
    }
}

export default {
  // Auth functions
  registerUser,
  loginUser,
  logoutUser,

  // Session functions
  // Talvez separar em outro arquivo futuramente
  validateSession,
  getUserActiveSession,
  invalidateUserSessions
}