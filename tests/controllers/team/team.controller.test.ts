import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/auth.types';

jest.mock('../../../models/Team', () => ({
  TeamModel: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../../models/User', () => ({
  UserModel: {
    find: jest.fn(),
  },
}));

const { TeamModel } = require('../../../models/Team');
const { UserModel } = require('../../../models/User');
const teamController = require('../../../controllers/teams/teams.controller').default;

describe('Team Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseObject: any;
  const mockUserPki = 'test-user-pki';

  beforeEach(() => {
    jest.clearAllMocks();

    responseObject = {};
    mockRequest = {
      params: {},
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

  describe('createTeam', () => {
    it('should create a team successfully with users and managers', async () => {
      mockRequest.body = { id: '1', name: 'Test Team', users: ['user1'], managers: ['manager1'] };

      TeamModel.findOne.mockResolvedValue(null);

      const countDocumentsMock = jest.fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      UserModel.find.mockReturnValue({ countDocuments: countDocumentsMock });

      const populatedTeam = {
        ...mockRequest.body,
        users: [{ _id: 'user1' }],
        managers: [{ _id: 'manager1' }],
      };

      TeamModel.create.mockResolvedValue({
        populate: jest.fn().mockResolvedValue(populatedTeam),
      });

      await teamController.createTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Team created');
      expect(responseObject.team).toEqual(populatedTeam);
    });

    it('should return 400 if users are not found', async () => {
      mockRequest.body = { users: ['user1'] };
      TeamModel.findOne.mockResolvedValue(null);
      UserModel.find.mockReturnValue({ countDocuments: jest.fn().mockResolvedValue(0) });

      await teamController.createTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.message).toBe('One or more users not found');
    });

    it('should return 403 if team already exists', async () => {
      mockRequest.body = { id: '1' };
      TeamModel.findOne.mockResolvedValue({ id: '1' });

      await teamController.createTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject.message).toBe('Team already exists');
    });

    it('should return 500 on server error', async () => {
      mockRequest.body = { id: '1' };
      TeamModel.findOne.mockRejectedValue(new Error('DB Error'));

      await teamController.createTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Error creating team');
    });
  });

  describe('getTeams', () => {
    it('should return all teams', async () => {
      const teams = [{ name: 'Team 1' }];
      TeamModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(teams),
        }),
      });

      await teamController.getTeams(mockRequest as AuthenticatedRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.teams).toEqual(teams);
    });

    it('should return 500 on server error', async () => {
      TeamModel.find.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await teamController.getTeams(mockRequest as AuthenticatedRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Error fetching teams');
    });
  });

  describe('updateTeam', () => {
    it('should update a team successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Team' };
      const existingTeam = { id: '1', name: 'Old Team' };
      const updatedTeam = { ...existingTeam, ...mockRequest.body };

      TeamModel.findOne.mockResolvedValue(existingTeam);
      TeamModel.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedTeam),
        }),
      });

      await teamController.updateTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.team.name).toBe('Updated Team');
    });

    it('should update only the team name', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'New Name' };

      const existingTeam = { id: '1', name: 'Old Name' };
      const updatedTeam = { ...existingTeam, ...mockRequest.body };

      TeamModel.findOne.mockResolvedValue(existingTeam);
      TeamModel.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedTeam),
        }),
      });

      await teamController.updateTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.team.name).toBe('New Name');
    });

    it('should update users and managers list', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        users: ['user2'],
        managers: ['manager2']
      };

      const existingTeam = { id: '1', name: 'Test Team' };
      const updatedTeam = {
        ...existingTeam,
        users: [{ _id: 'user2' }],
        managers: [{ _id: 'manager2' }]
      };

      const countDocumentsMock = jest.fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      UserModel.find.mockReturnValue({ countDocuments: countDocumentsMock });

      TeamModel.findOne.mockResolvedValue(existingTeam);
      TeamModel.findOneAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(updatedTeam),
        }),
      });

      await teamController.updateTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.team.users).toEqual([{ _id: 'user2' }]);
      expect(responseObject.team.managers).toEqual([{ _id: 'manager2' }]);
    });

    it('should return 404 if team not found', async () => {
      mockRequest.params = { id: '1' };
      TeamModel.findOne.mockResolvedValue(null);
      await teamController.updateTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Team not found');
    });

    it('should return 500 on server error', async () => {
      mockRequest.params = { id: '1' };
      TeamModel.findOne.mockRejectedValue(new Error('DB Error'));
      await teamController.updateTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Error updating team');
    });
  });

  describe('deleteTeam', () => {
    it('should deactivate a team successfully', async () => {
      mockRequest.params = { id: '1' };

      const populatedTeam = { id: '1', active: false };
      const teamInstance = {
        id: '1',
        active: true,
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue(populatedTeam),
      };

      TeamModel.findOne.mockResolvedValue(teamInstance);

      await teamController.deleteTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(teamInstance.active).toBe(false);
      expect(teamInstance.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Team Deactivated');
      expect(responseObject.team.active).toBe(false);
    });

    it('should return 404 if team not found', async () => {
      mockRequest.params = { id: '1' };
      TeamModel.findOne.mockResolvedValue(null);
      await teamController.deleteTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject.message).toBe('Team not found');
    });

    it('should return 500 on server error', async () => {
      mockRequest.params = { id: '1' };
      TeamModel.findOne.mockRejectedValue(new Error('DB Error'));
      await teamController.deleteTeam(mockRequest as AuthenticatedRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject.message).toBe('Error deactivating team');
    });
  });
});
