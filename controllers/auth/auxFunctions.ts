const bcrypt = require('bcrypt');
import uuid4  from 'uuid4';
import { Request, Response, NextFunction } from 'express';
import { SessionModel } from '../../models/Session';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
    user?: {
        pki: string;
        sessionId: string;
    };
}

const saltRounds = 10;

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const generateUUID = () => {
  const id = uuid4()
  return id
};

export const sessionMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: "Token not provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        
        if (!decoded.sessionId || !decoded.pki) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        // Validar sessão específica
        const session = await SessionModel.findOne({ 
            sessionId: decoded.sessionId,
            userPki: decoded.pki,
            valid: true,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(401).json({ message: "Invalid or expired session" });
        }

        // Verificar se é a única sessão ativa (estratégia uma sessão por usuário)
        const activeSessions = await SessionModel.countDocuments({
            userPki: decoded.pki,
            valid: true,
            expiresAt: { $gt: new Date() }
        });

        if (activeSessions > 1) {
            // Log para monitoramento - não deveria acontecer com a nova estratégia
            console.warn(`Usuário ${decoded.pki} possui ${activeSessions} sessões ativas`);
        }

        // Adicionar informações da sessão ao request para uso posterior
        req.user = {
            pki: decoded.pki,
            sessionId: decoded.sessionId
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

export const checkUserActiveSessions = async (userPki: string): Promise<number> => {
    try {
        const count = await SessionModel.countDocuments({
            userPki: userPki,
            valid: true,
            expiresAt: { $gt: new Date() }
        });
        return count;
    } catch (error) {
        return 0;
    }
}