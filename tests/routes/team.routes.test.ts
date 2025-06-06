import request from 'supertest';
import express from 'express';
import teamRoutes from '../../routes/team/team.routes';
import { SessionModel } from '../../models/Session';
import { validateToken, extractTokenFromHeader } from '../../utils/jwt.utils';
import teamController from '../../controllers/teams/teams.controller';

jest.mock('../../models/Session');
jest.mock('../../utils/jwt.utils');
// Mock the controller to avoid actual DB calls
jest.mock('../../controllers/teams/teams.controller', () => ({
    createTeam: jest.fn((req, res) => res.status(201).json({ message: 'Team created' })),
    updateTeam: jest.fn((req, res) => res.status(200).json({ message: 'Team updated' })),
    deleteTeam: jest.fn((req, res) => res.status(200).json({ message: 'Team deleted' })),
    getTeams: jest.fn((req, res) => res.status(200).json({ teams: [] })),
}));


const app = express();
app.use(express.json());
app.use('/teams', teamRoutes);

describe('Team Routes Token Validation', () => {
    const mockedExtractToken = extractTokenFromHeader as jest.Mock;
    const mockedValidateToken = validateToken as jest.Mock;
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    const protectedRoutes = [
        { method: 'post', path: '/teams' },
        { method: 'get', path: '/teams' },
        { method: 'put', path: '/teams/1' },
        { method: 'put', path: '/teams/delete/1' },
    ];

    protectedRoutes.forEach(route => {
        it(`should return 401 for ${route.method.toUpperCase()} ${route.path} if no token is provided`, async () => {
            mockedExtractToken.mockReturnValue(null);
            const response = await (request(app) as any)[route.method](route.path).send({});
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Token not provided');
        });

        it(`should return 401 for ${route.method.toUpperCase()} ${route.path} if token is invalid`, async () => {
            mockedExtractToken.mockReturnValue('invalidtoken');
            mockedValidateToken.mockReturnValue({ isValid: false, error: 'Invalid token' });

            const response = await (request(app) as any)[route.method](route.path)
                .set('Authorization', 'Bearer invalidtoken')
                .send({});
            
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid token');
        });

        it(`should return 401 for ${route.method.toUpperCase()} ${route.path} if session is invalid or expired`, async () => {
            mockedExtractToken.mockReturnValue('validtoken');
            mockedValidateToken.mockReturnValue({ isValid: true, decoded: { sessionId: '123', pki: 'user1' } });
            (SessionModel.findOne as jest.Mock).mockResolvedValue(null);

            const response = await (request(app) as any)[route.method](route.path)
                .set('Authorization', 'Bearer validtoken')
                .send({});

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid or expired session');
        });

        it(`should call the controller for ${route.method.toUpperCase()} ${route.path} if token is valid`, async () => {
            mockedExtractToken.mockReturnValue('validtoken');
            mockedValidateToken.mockReturnValue({ isValid: true, decoded: { sessionId: '123', pki: 'user1' } });
            (SessionModel.findOne as jest.Mock).mockResolvedValue({ valid: true });

            const response = await (request(app) as any)[route.method](route.path)
                .set('Authorization', 'Bearer validtoken')
                .send({ name: 'Test' });

            expect(response.status).toBeLessThan(400);
        });
    });

    it('should not require token for GET /teams', async () => {
        const response = await request(app).get('/teams');
        expect(response.status).toBe(200);
        expect(teamController.getTeams).toHaveBeenCalled();
    });
}); 