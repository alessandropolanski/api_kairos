/**
 * Configurações centralizadas de autenticação
 */

export const authConfig = {
    // Configurações JWT
    jwt: {
        secret: process.env.JWT_SECRET || process.env.API_TOKEN || 'default-secret-key',
        expiresIn: '24h',
        algorithm: 'HS256' as const
    },
    
    // Configurações de sessão
    session: {
        duration: 24 * 60 * 60 * 1000, // 24 horas em millisegundos
        maxActiveSessions: 1, // Uma sessão ativa por usuário
        cleanupInterval: 60 * 60 * 1000 // Limpar sessões expiradas a cada hora
    },
    
    // Rotas públicas (não precisam de autenticação)
    publicRoutes: [
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/register',
        '/health',
        '/status'
    ],
    
    // Configurações de segurança
    security: {
        bcryptSaltRounds: 10,
        tokenHeaderName: 'authorization',
        tokenPrefix: 'Bearer '
    }
} as const;

// Validação da configuração
export const validateAuthConfig = (): boolean => {
    if (!authConfig.jwt.secret || authConfig.jwt.secret === 'default-secret-key') {
        console.warn('⚠️  Usando chave secreta padrão para JWT. Configure JWT_SECRET ou API_TOKEN em produção!');
        return process.env.NODE_ENV !== 'production';
    }
    return true;
};

// Inicializar configuração (chamar no startup da aplicação)
export const initAuthConfig = (): void => {
    if (!validateAuthConfig()) {
        throw new Error('Configuração de autenticação inválida para ambiente de produção');
    }
    
    console.log('✅ Configuração de autenticação inicializada');
}; 