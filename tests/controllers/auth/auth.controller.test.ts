import { Request, Response } from 'express';
import authController from '../../../controllers/auth/auth.controller';
import { db } from '../../../database/database';
import { hashPassword } from '../../../controllers/auth/auxFunctions';

// Mock das dependências
jest.mock('../../../database/database');
jest.mock('../../../controllers/auth/auxFunctions');

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
      // Mock do findOne retornando um usuário existente
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
      // Mock do findOne retornando null (usuário não existe)
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ acknowledged: true })
      });

      // Mock da função hashPassword
      (hashPassword as jest.Mock).mockReturnValue('hashedPassword');

      await authController.registerUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toEqual({ message: 'Created' });
    });
  });
}); 