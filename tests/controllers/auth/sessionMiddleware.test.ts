import { Request, Response, NextFunction } from 'express';
import { sessionMiddleware, checkUserActiveSessions } from '../../../controllers/auth/auxFunctions';
import { SessionModel } from '../../../models/Session';
import jwt from 'jsonwebtoken';

// Mock das dependências
jest.mock('../../../models/Session');
jest.mock('jsonwebtoken');

describe('Session Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseObject: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      headers: {
        authorization: 'Bearer fakeToken'
      }
    };

    responseObject = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      })
    };

    mockNext = jest.fn();
  });

  describe('sessionMiddleware', () => {
    it('deve retornar 401 quando token não é fornecido', async () => {
      mockRequest.headers = {};

      await sessionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({ message: 'Token not provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando token é inválido', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await sessionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando token não possui sessionId ou pki', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ pki: 'testpki' }); // Sem sessionId

      await sessionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({ message: 'Invalid token format' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando sessão não é encontrada ou é inválida', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ 
        pki: 'testpki', 
        sessionId: 'uuid-123-456' 
      });
      (SessionModel.findOne as jest.Mock).mockResolvedValue(null);
      (SessionModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await sessionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({ message: 'Invalid or expired session' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve passar com sucesso e adicionar informações do usuário ao request', async () => {
      const mockSession = {
        sessionId: 'uuid-123-456',
        userPki: 'testpki',
        valid: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      (jwt.verify as jest.Mock).mockReturnValue({ 
        pki: 'testpki', 
        sessionId: 'uuid-123-456' 
      });
      (SessionModel.findOne as jest.Mock).mockResolvedValue(mockSession);
      (SessionModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await sessionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        pki: 'testpki',
        sessionId: 'uuid-123-456'
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve alertar quando usuário possui múltiplas sessões ativas', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mockSession = {
        sessionId: 'uuid-123-456',
        userPki: 'testpki',
        valid: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      (jwt.verify as jest.Mock).mockReturnValue({ 
        pki: 'testpki', 
        sessionId: 'uuid-123-456' 
      });
      (SessionModel.findOne as jest.Mock).mockResolvedValue(mockSession);
      (SessionModel.countDocuments as jest.Mock).mockResolvedValue(3); // Múltiplas sessões

      await sessionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalledWith('Usuário testpki possui 3 sessões ativas');
      expect(mockNext).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('deve validar sessão com parâmetros corretos', async () => {
      const mockSession = {
        sessionId: 'uuid-123-456',
        userPki: 'testpki',
        valid: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      (jwt.verify as jest.Mock).mockReturnValue({ 
        pki: 'testpki', 
        sessionId: 'uuid-123-456' 
      });
      (SessionModel.findOne as jest.Mock).mockResolvedValue(mockSession);
      (SessionModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await sessionMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(SessionModel.findOne).toHaveBeenCalledWith({
        sessionId: 'uuid-123-456',
        userPki: 'testpki',
        valid: true,
        expiresAt: { $gt: expect.any(Date) }
      });

      expect(SessionModel.countDocuments).toHaveBeenCalledWith({
        userPki: 'testpki',
        valid: true,
        expiresAt: { $gt: expect.any(Date) }
      });
    });
  });

  describe('checkUserActiveSessions', () => {
    it('deve retornar o número correto de sessões ativas', async () => {
      (SessionModel.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await checkUserActiveSessions('testpki');

      expect(result).toBe(2);
      expect(SessionModel.countDocuments).toHaveBeenCalledWith({
        userPki: 'testpki',
        valid: true,
        expiresAt: { $gt: expect.any(Date) }
      });
    });

    it('deve retornar 0 quando não há sessões ativas', async () => {
      (SessionModel.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await checkUserActiveSessions('testpki');

      expect(result).toBe(0);
    });

    it('deve retornar 0 quando ocorre erro', async () => {
      (SessionModel.countDocuments as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await checkUserActiveSessions('testpki');

      expect(result).toBe(0);
    });
  });
}); 