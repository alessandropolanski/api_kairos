import { AuthenticatedRequest } from './auth.types';

declare global {
    namespace Express {
        interface Request {
            user?: {
                pki: string;
                sessionId: string;
            };
        }
    }
} 