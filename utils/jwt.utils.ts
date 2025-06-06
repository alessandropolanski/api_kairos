import jwt from 'jsonwebtoken';
import { JwtPayload, TokenValidationResult } from '../types/auth.types';
import { authConfig } from '../config/auth.config';

/**
 * Gera um token JWT
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, authConfig.jwt.secret, { 
        expiresIn: authConfig.jwt.expiresIn,
        algorithm: authConfig.jwt.algorithm
    });
};

/**
 * Valida e decodifica um token JWT
 */
export const validateToken = (token: string): TokenValidationResult => {
    try {
        const decoded = jwt.verify(token, authConfig.jwt.secret) as JwtPayload;
        
        // Validação adicional da estrutura do payload
        if (!decoded.pki || !decoded.sessionId) {
            return {
                isValid: false,
                error: 'Invalid token format - missing required fields'
            };
        }

        return {
            isValid: true,
            decoded
        };
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown token validation error'
        };
    }
};

/**
 * Extrai token do header Authorization
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
    if (!authHeader) return null;
    
    // Suporta tanto 'Bearer token' quanto apenas 'token'
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : authHeader;
};

/**
 * Verifica se um token está expirado
 */
export const isTokenExpired = (decoded: JwtPayload): boolean => {
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
}; 