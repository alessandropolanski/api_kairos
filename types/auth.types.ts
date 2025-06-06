import { Request } from 'express';

// Payload do JWT Token
export interface JwtPayload {
    pki: string;
    sessionId: string;
    iat?: number;
    exp?: number;
}

// Request extendido com informações do usuário autenticado
export interface AuthenticatedRequest extends Request {
    user?: {
        pki: string;
        sessionId: string;
    };
}

// Resultado da validação de token
export interface TokenValidationResult {
    isValid: boolean;
    decoded?: JwtPayload;
    error?: string;
}

// Dados de login
export interface LoginCredentials {
    pki: string;
    password: string;
}

// Resposta de login
export interface LoginResponse {
    message: string;
    token: string;
    sessionId: string;
}

// Configuração JWT
export interface JwtConfig {
    secret: string;
    expiresIn?: string;
} 