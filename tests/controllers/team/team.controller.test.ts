import { Request, Response } from 'express';
import teamController from '../../../controllers/teams/teams.controller';
import { TeamModel } from '../../../models/Team';
import { UserModel } from '../../../models/User';

jest.mock('../../../models/Team');
jest.mock('../../../models/User');

describe('Team Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    jest.clearAllMocks();

    responseObject = {};
    mockRequest = {
      params: {},
      body: {},
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
    it('should create a team successfully', async () => {
      mockRequest.body = {
        id: '1',
        name: 'Test Team',
        active: true,
        users: [],
        managers: [],
      };

      (TeamModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.find as jest.Mock).mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0)
      });

      const newTeam = {
        id: '1',
        name: 'Test Team',
        active: true,
        users: [],
        managers: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        lastModifiedBy: 'system',
      };
      (TeamModel.create as jest.Mock).mockResolvedValue(newTeam);

      await teamController.createTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Team created');
      expect(responseObject.team).toEqual(newTeam);
    });

    it('should create a team with users and managers successfully', async () => {
      mockRequest.body = {
        id: '1',
        name: 'Test Team',
        active: true,
        users: ['user1'],
        managers: ['manager1'],
      };

      (TeamModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.find as jest.Mock).mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(1)
      });
      const newTeam = {
        id: '1',
        name: 'Test Team',
        active: true,
        users: ['user1'],
        managers: ['manager1'],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        lastModifiedBy: 'system',
      };
      (TeamModel.create as jest.Mock).mockResolvedValue(newTeam);

      await teamController.createTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Team created');
    });

    it('should create a team with multiple users and managers successfully', async () => {
      mockRequest.body = {
        id: '1',
        name: 'Test Team',
        active: true,
        users: ['user1', 'user2'],
        managers: ['manager1', 'manager2'],
      };

      (TeamModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.find as jest.Mock).mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(2)
      });
      const newTeam = {
        id: '1',
        name: 'Test Team',
        active: true,
        users: ['user1', 'user2'],
        managers: ['manager1', 'manager2'],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        lastModifiedBy: 'system',
      };
      (TeamModel.create as jest.Mock).mockResolvedValue(newTeam);

      await teamController.createTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Team created');
    });

    it('should return 400 if users not found', async () => {
      mockRequest.body = {
        id: '1',
        name: 'Test Team',
        users: ['user1'],
      };

      (TeamModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.find as jest.Mock).mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0)
      });

      await teamController.createTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({ message: 'One or more users not found' });
    });

    it('should return 400 if managers not found', async () => {
      mockRequest.body = {
        id: '1',
        name: 'Test Team',
        managers: ['manager1'],
      };

      (TeamModel.findOne as jest.Mock).mockResolvedValue(null);
      (UserModel.find as jest.Mock).mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0)
      });

      await teamController.createTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({ message: 'One or more managers not found' });
    });

    it('should return 403 if team already exists', async () => {
      mockRequest.body = { id: '1' };
      (TeamModel.findOne as jest.Mock).mockResolvedValue({ id: '1' });

      await teamController.createTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(responseObject).toEqual({ message: 'Team already exists' });
    });

    it('should return 500 on server error', async () => {
      const error = new Error('Server error');
      mockRequest.body = { id: '1' };
      (TeamModel.findOne as jest.Mock).mockRejectedValue(error);

      await teamController.createTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({ message: error });
    });
  });

  describe('getTeams', () => {
    it('should return all teams', async () => {
      const teams = [{ name: 'Team 1' }, { name: 'Team 2' }];
      (TeamModel.find as jest.Mock).mockResolvedValue(teams);

      await teamController.getTeams(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toEqual({
        message: 'Teams fetched',
        teams: teams,
      });
    });

    it('should return 500 on server error', async () => {
      const error = new Error('Error fetching teams');
      (TeamModel.find as jest.Mock).mockRejectedValue(error);

      await teamController.getTeams(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseObject).toEqual({ message: error });
    });
  });

  describe('updateTeam', () => {
    it('should update a team successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Team' };

      const existingTeam = { id: '1', name: 'Old Team', active: true, users: [], managers: [] };
      const updatedTeamData = { ...existingTeam, name: 'Updated Team' };
      
      (TeamModel.findOne as jest.Mock).mockResolvedValue(existingTeam);
      (TeamModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedTeamData);

      await teamController.updateTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Team updated');
      expect(responseObject.team.name).toBe('Updated Team');
    });

    it('should update a team with users and managers successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { users: ['user1'], managers: ['manager1'] };

      const existingTeam = { id: '1', name: 'Old Team', active: true, users: [], managers: [] };
      const updatedTeamData = { ...existingTeam, users: ['user1'], managers: ['manager1'] };
      
      (TeamModel.findOne as jest.Mock).mockResolvedValue(existingTeam);
      (UserModel.find as jest.Mock).mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(1)
      });
      (TeamModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedTeamData);

      await teamController.updateTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.message).toBe('Team updated');
    });

    it('should return 400 if users not found on update', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { users: ['user1'] };

      const existingTeam = { id: '1', name: 'Old Team', active: true, users: [], managers: [] };
      
      (TeamModel.findOne as jest.Mock).mockResolvedValue(existingTeam);
      (UserModel.find as jest.Mock).mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0)
      });

      await teamController.updateTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({ message: 'One or more users not found' });
    });

    it('should return 400 if managers not found on update', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { managers: ['manager1'] };

      const existingTeam = { id: '1', name: 'Old Team', active: true, users: [], managers: [] };
      
      (TeamModel.findOne as jest.Mock).mockResolvedValue(existingTeam);
      (UserModel.find as jest.Mock).mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0)
      });

      await teamController.updateTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject).toEqual({ message: 'One or more managers not found' });
    });

    it('should return 404 if team not found', async () => {
      mockRequest.params = { id: '1' };
      (TeamModel.findOne as jest.Mock).mockResolvedValue(null);

      await teamController.updateTeam(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toEqual({ message: 'Team not found' });
    });

    it('should return 500 on server error', async () => {
        mockRequest.params = { id: '1' };
        const error = new Error('DB Error');
        (TeamModel.findOne as jest.Mock).mockRejectedValue(error);

        await teamController.updateTeam(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({ message: 'Error updating team' });
    });
  });

  describe('deleteTeam', () => {
    it('should deactivate a team successfully', async () => {
        mockRequest.params = { id: '1' };
        const team = {
            id: '1',
            name: 'Test Team',
            active: true,
            save: jest.fn().mockResolvedValue(this)
        };
        (TeamModel.findOne as jest.Mock).mockResolvedValue(team);

        await teamController.deleteTeam(mockRequest as Request, mockResponse as Response);

        expect(team.active).toBe(false);
        expect(team.save).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseObject.message).toBe('Team Deactivated');
    });

    it('should return 404 if team not found', async () => {
        mockRequest.params = { id: '1' };
        (TeamModel.findOne as jest.Mock).mockResolvedValue(null);

        await teamController.deleteTeam(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseObject).toEqual({ message: 'Team not found' });
    });

    it('should return 500 on server error', async () => {
        mockRequest.params = { id: '1' };
        const error = new Error('DB Error');
        (TeamModel.findOne as jest.Mock).mockRejectedValue(error);

        await teamController.deleteTeam(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseObject).toEqual({ message: 'Error deactivating team' });
    });
  });
});
