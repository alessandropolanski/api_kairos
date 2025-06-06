import request from 'supertest';
import express from 'express';
import userRoutes from '../../routes/user/user.routes';
import { SessionModel } from '../../models/Session';
import jwt from 'jsonwebtoken';

jest.mock('../../models/Session');
jest.mock('jsonwebtoken');
jest.mock('../../controllers/users/users.controller', () => ({
    updateUser: jest.fn((req, res) => res.status(200).json({ message: 'User updated' })),
}));

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

describe('User Routes Token Validation', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const pki = 'test-pki';

    it('should return 401 for PUT /users/:pki if no token is provided', async () => {
        const response = await request(app).put(`/users/${pki}`).send({ name: 'New Name' });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Token not provided');
    });

    it('should return 401 for PUT /users/:pki if token is invalid', async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const response = await request(app)
            .put(`/users/${pki}`)
            .set('Authorization', 'Bearer invalidtoken')
            .send({ name: 'New Name' });
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token');
    });

    it('should return 401 for PUT /users/:pki if session is invalid or expired', async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ sessionId: '123', pki: pki });
        (SessionModel.findOne as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
            .put(`/users/${pki}`)
            .set('Authorization', 'Bearer validtoken')
            .send({ name: 'New Name' });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid or expired session');
    });

    it('should call the controller for PUT /users/:pki if token is valid', async () => {
        (jwt.verify as jest.Mock).mockReturnValue({ sessionId: '123', pki: pki });
        (SessionModel.findOne as jest.Mock).mockResolvedValue({ valid: true });

        const response = await request(app)
            .put(`/users/${pki}`)
            .set('Authorization', 'Bearer validtoken')
            .send({ name: 'New Name' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User updated');
    });
});
