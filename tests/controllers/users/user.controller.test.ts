import { Request, Response } from 'express';
import userController from '../../../controllers/users/users.controller';
import { db } from '../../../database/database';
import { hashPassword } from '../../../controllers/auth/auxFunctions';
 
// Mock das dependências
jest.mock('../../../database/database');
jest.mock('../../../controllers/auth/auxFunctions');
 
describe('Users Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;
 
  const existingUser = {
    pki: '123xyz',
    name: 'testuser',
    email: 'test@example.com',
    role: 'user',
    password: 'oldpassword',
    active: true,
  };
 
  beforeEach(() => {
    mockRequest = {
      params: {
        pki: existingUser.pki,
      },
      body: {
        name: 'updateduser',
        email: 'updated@example.com',
        role: 'admin',
        password: 'newpassword123',
        active: false,
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
 
    // Reset mocks before each test
    (db.collection as jest.Mock).mockClear();
    (hashPassword as jest.Mock).mockClear();
   
    // Default mock for findOne to return an existing user for most tests
    (db.collection as jest.Mock).mockReturnValue({
      findOne: jest.fn().mockResolvedValue(existingUser),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true, modifiedCount: 1 }),
    });
    (hashPassword as jest.Mock).mockResolvedValue('hashedNewPassword'); // Mock for password hashing
  });
 
  describe('updateUser', () => {
    it('deve retornar 404 quando o usuário não existe', async () => {
      // Mock do findOne retornando null (usuário não existe)
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null)
      });
 
      await userController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );
 
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toEqual({ message: 'User not found' });
    });
 
    it('deve retornar 400 quando nenhum dado é alterado', async () => {
      mockRequest.body = {
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        password: existingUser.password,
        active: existingUser.active,
      };
     
      // Specific mock for findOne to return the original password for "no changes" check
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ ...existingUser }),
        updateOne: jest.fn()
      });
 
      await userController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );
 
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({ message: 'No changes made' });
      expect(db.collection('users').updateOne).not.toHaveBeenCalled();
    });
   
    it('deve atualizar o usuário com sucesso quando os dados são válidos e diferentes', async () => {
      mockRequest.body = {
        name: 'brandNewName',
        email: 'brandnewemail@example.com',
        role: 'editor',
        password: 'brandNewPassword!',
        active: false,
      };
 
      (hashPassword as jest.Mock).mockResolvedValue('hashedBrandNewPassword');
 
      await userController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );
 
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual({ message: 'User updated' });
      expect(db.collection('users').updateOne).toHaveBeenCalledWith(
        { pki: existingUser.pki },
        { $set: {
            name: 'brandNewName',
            email: 'brandnewemail@example.com',
            role: 'editor',
            password: 'hashedBrandNewPassword',
            active: false,
        } }
      );
      expect(hashPassword).toHaveBeenCalledWith('brandNewPassword!');
    });
 
    it('deve retornar 400 em caso de erro de validação do Zod', async () => {
      mockRequest.body.email = 'invalid-email'; // Invalid data
 
      await userController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );
 
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({ message: 'Invalid user data' });
    });
 
    it('deve retornar 500 em caso de erro no banco de dados ao atualizar', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(existingUser),
        updateOne: jest.fn().mockRejectedValue(new Error('DB update error'))
      });
 
      mockRequest.body.name = "anotherName";
 
      await userController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );
 
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({ message: 'Error updating user' });
    });
  });
});
 