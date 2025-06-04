declare namespace Express {
    interface Request {
        user?: {
            pki: string;
            sessionId: string;
        };
    }
} 