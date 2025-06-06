import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { authMiddlewareWithPublicRoutes } from './auth.middleware';


export const sessionMiddleware = authMiddlewareWithPublicRoutes([
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
]);