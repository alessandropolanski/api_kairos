import { Request, Response } from 'express';
import authController from '../../../controllers/auth/auth.controller';
import { db } from '../../../database/database';
import { hashPassword } from '../../../controllers/auth/auxFunctions';
import { comparePassword } from '../../../controllers/auth/auxFunctions';
import jwt from 'jsonwebtoken';

// Mock das dependências
jest.mock('../../../database/database');
jest.mock('../../../controllers/auth/auxFunctions');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    mockRequest = {
      body: {
        username: 'testuser',
        password: 'testpassword'
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
        findOne: jest.fn().mockResolvedValue({ username: 'testuser' })
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

      (hashPassword as jest.Mock).mockReturnValue('hashedPassword');

      await authController.registerUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toEqual({ message: 'Created' });
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

    it('deve fazer login com sucesso e retornar um token', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ 
          pki: 'testpki',
          password: 'hashedPassword'
        })
      });

      (comparePassword as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

      await authController.loginUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual({ 
        message: 'Login successful', 
        token: 'fakeToken' 
      });
    });

    it('deve retornar 500 quando ocorre um erro', async () => {
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
}); 