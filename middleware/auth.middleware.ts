import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { validateToken, extractTokenFromHeader } from '../utils/jwt.utils';
import { SessionModel } from '../models/Session';

export const authMiddleware = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
) => {
    try {
        // Extrair token do header
        const token = extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            return res.status(401).json({ message: 'Token not provided' });
        }

        // Validar token JWT
        const validation = validateToken(token);
        
        if (!validation.isValid || !validation.decoded) {
            return res.status(401).json({ 
                message: validation.error || 'Invalid token' 
            });
        }

        // Verificar se a sessão ainda é válida no banco
        const session = await SessionModel.findOne({
            sessionId: validation.decoded.sessionId,
            userPki: validation.decoded.pki,
            valid: true,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(401).json({ 
                message: 'Invalid or expired session' 
            });
        }

        req.user = {
            pki: validation.decoded.pki,
            sessionId: validation.decoded.sessionId
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: 'Authentication error' 
        });
    }
};

/**
 * Middleware que permite pular autenticação para rotas públicas
 */
export const authMiddlewareWithPublicRoutes = (publicRoutes: string[] = []) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // Verificar se é uma rota pública
        if (publicRoutes.includes(req.path)) {
            return next();
        }

        // Caso contrário, aplicar autenticação normal
        return authMiddleware(req, res, next);
    };
};

/**
 * Middleware opcional - não falha se não houver token
 * Útil para rotas que podem funcionar com ou sem autenticação
 */
export const optionalAuthMiddleware = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
            return next(); // Continua sem usuário autenticado
        }

        const validation = validateToken(token);
        
        if (validation.isValid && validation.decoded) {
            // Verificar sessão se o token for válido
            const session = await SessionModel.findOne({
                sessionId: validation.decoded.sessionId,
                userPki: validation.decoded.pki,
                valid: true,
                expiresAt: { $gt: new Date() }
            });

            if (session) {
                req.user = {
                    pki: validation.decoded.pki,
                    sessionId: validation.decoded.sessionId
                };
            }
        }

        next();
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        next(); // Continua mesmo com erro
    }
}; 