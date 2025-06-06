import { Request, Response } from 'express';
import userController from '../../../controllers/users/users.controller';
 
jest.setTimeout(100000);
 
// Mocks estáticos
jest.mock('../../../models/User', () => {
  return {
    __esModule: true,
    UserModel: {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    },
  };
});
 
jest.mock('../../../controllers/auth/auxFunctions', () => {
  return {
    hashPassword: jest.fn(),
  };
});
 
// Importações dos mocks depois do jest.mock
const { UserModel } = require('../../../models/User');
const { hashPassword } = require('../../../controllers/auth/auxFunctions');
 
describe('User Controller - updateUser', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;
  const mockDate = new Date('2024-01-01T00:00:00.000Z');
  const mockUserPki = 'adminPki';
 
  const baseUser = {
    pki: '123xyz',
    name: 'testuser',
    email: 'test@example.com',
    role: 'user',
    password: 'oldpassword',
    active: true,
  };
 
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
 
    responseObject = {};
 
    mockRequest = {
      params: { pki: baseUser.pki },
      body: {},
      user: { pki: mockUserPki } as any,
    };
 
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((res) => {
        responseObject = res;
        return mockResponse;
      }),
    };
  });
 
  it('retorna 404 se o usuário não for encontrado', async () => {
    UserModel.findOne.mockResolvedValue(null);
 
    await userController.updateUser(mockRequest as Request, mockResponse as Response);
 
    expect(UserModel.findOne).toHaveBeenCalledWith({ pki: baseUser.pki });
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(responseObject).toEqual({ message: 'User not found' });
  });
 
  it('atualiza o usuário com sucesso com dados novos, refletindo a lógica de "active"', async () => {
    const foundUser = { ...baseUser, password: 'hashedOldPassword', active: true };
    UserModel.findOne.mockResolvedValue(foundUser);
    hashPassword.mockResolvedValue('hashedNewPassword');
 
    const requestBody = {
      name: 'newName',
      email: 'new@example.com',
      role: 'editor',
      password: 'newpassword',
      active: false,
    };
    mockRequest.body = requestBody;
 
    const expectedActiveStateInDb = requestBody.active || foundUser.active;
 
    const updatedUserMock = {
      pki: baseUser.pki,
      name: requestBody.name,
      email: requestBody.email,
      password: 'hashedNewPassword',
      active: expectedActiveStateInDb,
      updatedAt: mockDate,
      lastModifiedBy: mockUserPki,
    };
    UserModel.findOneAndUpdate.mockResolvedValue(updatedUserMock);
 
    await userController.updateUser(mockRequest as Request, mockResponse as Response);
 
    expect(hashPassword).toHaveBeenCalledWith('newpassword');
    expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { pki: baseUser.pki },
      {
        $set: {
          name: requestBody.name,
          email: requestBody.email,
          role: requestBody.role,
          password: 'hashedNewPassword',
          active: expectedActiveStateInDb,
          updatedAt: mockDate,
          lastModifiedBy: mockUserPki,
        },
      },
      { new: true }
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseObject).toEqual({
      message: 'User updated',
      user: {
        name: updatedUserMock.name,
        email: updatedUserMock.email,
        active: updatedUserMock.active,
      },
    });
  });
 
  it('atualiza somente o nome do usuário', async () => {
    const foundUser = { ...baseUser, password: 'hashedOriginal', active: true, email: baseUser.email, role: baseUser.role };
    UserModel.findOne.mockResolvedValue(foundUser);
 
    const requestBody = { name: 'updatedName' };
    mockRequest.body = requestBody;
 
    const updatedUserMock = {
      ...foundUser,
      name: requestBody.name,
    };
    UserModel.findOneAndUpdate.mockResolvedValue(updatedUserMock);
 
    await userController.updateUser(mockRequest as Request, mockResponse as Response);
 
    expect(hashPassword).not.toHaveBeenCalled();
    expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { pki: baseUser.pki },
      { $set: {
          name: requestBody.name,
          email: foundUser.email,
          role: foundUser.role,
          password: foundUser.password,
          active: foundUser.active,
          updatedAt: mockDate,
          lastModifiedBy: mockUserPki,
        }
      },
      { new: true }
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseObject).toEqual({
      message: 'User updated',
      user: {
        name: updatedUserMock.name,
        email: updatedUserMock.email,
        active: updatedUserMock.active,
      },
    });
  });
 
  it('retorna 500 em erro ao buscar usuário', async () => {
    UserModel.findOne.mockRejectedValue(new Error('DB error'));
 
    await userController.updateUser(mockRequest as Request, mockResponse as Response);
 
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseObject).toEqual({ message: 'Error updating user' });
  });
 
  it('retorna 500 em erro ao atualizar usuário', async () => {
    UserModel.findOne.mockResolvedValue({ ...baseUser, password: 'hashedOldPassword' });
    UserModel.findOneAndUpdate.mockRejectedValue(new Error('Update error'));
 
    mockRequest.body = { name: 'newName' };
 
    await userController.updateUser(mockRequest as Request, mockResponse as Response);
 
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseObject).toEqual({ message: 'Error updating user' });
  });
 
  it('retorna 500 se hashPassword falhar', async () => {
    UserModel.findOne.mockResolvedValue({ ...baseUser, password: 'hashedOldPassword' });
    hashPassword.mockRejectedValue(new Error('Hash failed'));
 
    mockRequest.body = { password: 'newpassword' };
 
    await userController.updateUser(mockRequest as Request, mockResponse as Response);
 
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseObject).toEqual({ message: 'Error updating user' });
  });
 
  it('retorna 200 e dados do usuário quando os dados fornecidos não alteram o usuário existente', async () => {
    // Usuário existente no banco
    const existingUser = {
      ...baseUser,
      password: 'hashedOldPassword',
      active: true
    };
    UserModel.findOne.mockResolvedValue(existingUser);
   
    // Corpo da requisição com dados que não alteram o usuário
    // Ex: apenas o nome é fornecido, e é o mesmo do usuário existente.
    // Outros campos (email, role, active) serão preenchidos pelo controller com os valores de existingUser.
    // A senha não é fornecida, então o controller usará existingUser.password.
    mockRequest.body = { name: existingUser.name };
 
    // O controller irá construir newUser com os mesmos dados de existingUser
    const expectedNewDataSet = {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      password: existingUser.password, // Controller usa a senha existente se não for fornecida nova
      active: existingUser.active,    // Controller usa active existente (true) se não fornecido
      updatedAt: mockDate,
      lastModifiedBy: mockUserPki,
    };
 
    // findOneAndUpdate será chamado e deve retornar o usuário (mesmo que não modificado)
    const returnedUserFromUpdateMock = { ...expectedNewDataSet, pki: existingUser.pki };
    UserModel.findOneAndUpdate.mockResolvedValue(returnedUserFromUpdateMock);
 
    await userController.updateUser(mockRequest as Request, mockResponse as Response);
 
    expect(hashPassword).not.toHaveBeenCalled(); // Nenhuma nova senha fornecida
    expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { pki: existingUser.pki },
      { $set: expectedNewDataSet },
      { new: true }
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(responseObject).toEqual({
      message: 'User updated',
      user: {
        name: returnedUserFromUpdateMock.name,
        email: returnedUserFromUpdateMock.email,
        active: returnedUserFromUpdateMock.active,
      }
    });
  });
});