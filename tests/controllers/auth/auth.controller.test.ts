import { Request, Response } from 'express';
import authController from '../../../controllers/auth/auth.controller';
import { db } from '../../../database/database';
import { hashPassword, comparePassword } from '../../../controllers/auth/auxFunctions';
import { SessionModel } from '../../../models/Session';
import jwt from 'jsonwebtoken';

// Mock das dependências
jest.mock('../../../database/database');
jest.mock('../../../controllers/auth/auxFunctions');
jest.mock('../../../models/Session');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {
        pki: 'testpki',
        password: 'testpassword',
        name: 'Test User',
        email: 'test@test.com',
        role: 'user'
      },
      ip: '192.168.1.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
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
  });

  describe('registerUser', () => {
    it('deve retornar 403 quando o usuário já existe', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ pki: 'testpki' })
      });

      await authController.registerUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject).toEqual({ message: 'User already exists' });
    });

    it('deve criar um novo usuário com sucesso', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ acknowledged: true })
      });

      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword');

      await authController.registerUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toEqual({ message: 'Created' });
    });

    it('deve retornar 500 quando falha ao criar usuário', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ acknowledged: false })
      });

      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword');

      await authController.registerUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({ message: 'Failed to create user' });
    });
  });

  describe('loginUser', () => {
    it('deve retornar 401 quando o usuário não é encontrado', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null)
      });

      await authController.loginUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({ message: 'User not found' });
    });

    it('deve retornar 401 quando a senha está incorreta', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ 
          pki: 'testpki',
          password: 'hashedPassword'
        })
      });

      (comparePassword as jest.Mock).mockResolvedValue(false);

      await authController.loginUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({ message: 'Invalid password' });
    });

    it('deve fazer login com sucesso, invalidar sessões anteriores e criar nova sessão', async () => {
      const mockUser = { 
        pki: 'testpki',
        password: 'hashedPassword'
      };

      const mockSession = {
        sessionId: 'uuid-123-456',
        userPki: 'testpki',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        valid: true,
        save: jest.fn().mockResolvedValue({
          sessionId: 'uuid-123-456',
          userPki: 'testpki'
        })
      };

      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockUser)
      });

      (comparePassword as jest.Mock).mockResolvedValue(true);
      (SessionModel.updateMany as jest.Mock).mockResolvedValue({ acknowledged: true });
      (SessionModel as any).mockImplementation(() => mockSession);
      (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

      await authController.loginUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(SessionModel.updateMany).toHaveBeenCalledWith(
        { userPki: 'testpki' },
        { valid: false }
      );
      expect(mockSession.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { pki: 'testpki', sessionId: 'uuid-123-456' },
        'secret'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual({ 
        message: 'Login successful', 
        token: 'fakeToken',
        sessionId: 'uuid-123-456'
      });
    });

    it('deve retornar 500 quando ocorre um erro no login', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await authController.loginUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({ message: new Error('Database error') });
    });
  });

  describe('logoutUser', () => {
    it('deve retornar 401 quando token não é fornecido', async () => {
      mockRequest.headers = {};

      await authController.logoutUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject).toEqual({ message: 'Token not provided' });
    });

    it('deve retornar 400 quando token não possui sessionId', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ pki: 'testpki' });

      await authController.logoutUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({ message: 'Invalid token format' });
    });

    it('deve fazer logout com sucesso e invalidar a sessão', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ 
        pki: 'testpki', 
        sessionId: 'uuid-123-456' 
      });
      (SessionModel.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await authController.logoutUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(SessionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { sessionId: 'uuid-123-456' },
        { valid: false }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual({ message: 'Logout successful' });
    });

    it('deve retornar 500 quando ocorre erro no logout', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token error');
      });

      await authController.logoutUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({ message: new Error('Token error') });
    });
  });

  describe('validateSession', () => {
    it('deve retornar true para sessão válida', async () => {
      (SessionModel.findOne as jest.Mock).mockResolvedValue({
        sessionId: 'uuid-123-456',
        valid: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const result = await authController.validateSession('uuid-123-456');

      expect(result).toBe(true);
      expect(SessionModel.findOne).toHaveBeenCalledWith({
        sessionId: 'uuid-123-456',
        valid: true,
        expiresAt: { $gt: expect.any(Date) }
      });
    });

    it('deve retornar false para sessão inválida', async () => {
      (SessionModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await authController.validateSession('uuid-invalid');

      expect(result).toBe(false);
    });

    it('deve retornar false quando ocorre erro', async () => {
      (SessionModel.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await authController.validateSession('uuid-123-456');

      expect(result).toBe(false);
    });
  });

  describe('getUserActiveSession', () => {
    it('deve retornar sessão ativa do usuário', async () => {
      const mockSession = {
        sessionId: 'uuid-123-456',
        userPki: 'testpki',
        valid: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      (SessionModel.findOne as jest.Mock).mockResolvedValue(mockSession);

      const result = await authController.getUserActiveSession('testpki');

      expect(result).toEqual(mockSession);
      expect(SessionModel.findOne).toHaveBeenCalledWith({
        userPki: 'testpki',
        valid: true,
        expiresAt: { $gt: expect.any(Date) }
      });
    });

    it('deve retornar null quando usuário não tem sessão ativa', async () => {
      (SessionModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await authController.getUserActiveSession('testpki');

      expect(result).toBe(null);
    });

    it('deve retornar null quando ocorre erro', async () => {
      (SessionModel.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await authController.getUserActiveSession('testpki');

      expect(result).toBe(null);
    });
  });

  describe('invalidateUserSessions', () => {
    it('deve invalidar todas as sessões do usuário com sucesso', async () => {
      (SessionModel.updateMany as jest.Mock).mockResolvedValue({ 
        acknowledged: true,
        modifiedCount: 2
      });

      const result = await authController.invalidateUserSessions('testpki');

      expect(result).toBe(true);
      expect(SessionModel.updateMany).toHaveBeenCalledWith(
        { userPki: 'testpki' },
        { valid: false }
      );
    });

    it('deve retornar false quando ocorre erro', async () => {
      (SessionModel.updateMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await authController.invalidateUserSessions('testpki');

      expect(result).toBe(false);
    });
  });
}); 