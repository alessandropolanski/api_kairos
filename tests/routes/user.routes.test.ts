import request from 'supertest';
import express from 'express';
import userRoutes from '../../routes/user/user.routes';
import { SessionModel } from '../../models/Session';
import { UserModel } from '../../models/User';
import { validateToken, extractTokenFromHeader } from '../../utils/jwt.utils';

jest.mock('../../models/Session');
jest.mock('../../models/User');
jest.mock('../../utils/jwt.utils');
jest.mock('../../controllers/auth/auxFunctions', () => ({
    hashPassword: jest.fn(password => Promise.resolve(`hashed_${password}`))
}));

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

const mockedExtractToken = extractTokenFromHeader as jest.Mock;
const mockedValidateToken = validateToken as jest.Mock;
const mockedSessionFindOne = SessionModel.findOne as jest.Mock;
const mockedUserFindOne = UserModel.findOne as jest.Mock;
const mockedUserFindOneAndUpdate = UserModel.findOneAndUpdate as jest.Mock;

describe('User Routes', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /users/me', () => {
        const path = '/users/me';

        it('should return 401 if no token is provided', async () => {
            mockedExtractToken.mockReturnValue(null);
            const response = await request(app).get(path);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Token not provided');
        });

        it('should return 401 if token is invalid', async () => {
            mockedExtractToken.mockReturnValue('invalidtoken');
            mockedValidateToken.mockReturnValue({ isValid: false, error: 'Invalid token' });

            const response = await request(app)
                .get(path)
                .set('Authorization', 'Bearer invalidtoken');
            
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return 401 if session is invalid or expired', async () => {
            mockedExtractToken.mockReturnValue('validtoken');
            mockedValidateToken.mockReturnValue({ isValid: true, decoded: { sessionId: '123', pki: 'user1' } });
            mockedSessionFindOne.mockResolvedValue(null);

            const response = await request(app)
                .get(path)
                .set('Authorization', 'Bearer validtoken');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid or expired session');
        });

        describe('with valid token', () => {
            beforeEach(() => {
                mockedExtractToken.mockReturnValue('validtoken');
                mockedValidateToken.mockReturnValue({ isValid: true, decoded: { sessionId: '123', pki: 'user1' } });
                mockedSessionFindOne.mockResolvedValue({ valid: true });
            });

            it('should return 404 if user not found', async () => {
                mockedUserFindOne.mockResolvedValue(null);
                const response = await request(app)
                    .get(path)
                    .set('Authorization', 'Bearer validtoken');
                
                expect(response.status).toBe(404);
                expect(response.body.message).toBe('User not found');
            });

            it('should return 200 with user data if user is found', async () => {
                const mockUser = { pki: 'user1', name: 'Test User', email: 'test@test.com', role: 'user', active: true };
                mockedUserFindOne.mockResolvedValue(mockUser);
                const response = await request(app)
                    .get(path)
                    .set('Authorization', 'Bearer validtoken');
                
                expect(response.status).toBe(200);
                expect(response.body.user).toEqual({
                    pki: 'user1',
                    name: 'Test User',
                    email: 'test@test.com',
                    role: 'user',
                    active: true
                });
                expect(mockedUserFindOne).toHaveBeenCalledWith({ pki: 'user1' });
            });
        });
    });

    describe('PUT /users/:pki', () => {
        const pki = 'test-pki';
        const path = `/users/${pki}`;
        const updateData = { name: 'Updated Name' };

        it('should return 401 if no token is provided', async () => {
            mockedExtractToken.mockReturnValue(null);
            const response = await request(app).put(path).send(updateData);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Token not provided');
        });

        it('should return 401 if token is invalid', async () => {
            mockedExtractToken.mockReturnValue('invalidtoken');
            mockedValidateToken.mockReturnValue({ isValid: false, error: 'Invalid token' });
            const response = await request(app).put(path).set('Authorization', 'Bearer invalidtoken').send(updateData);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid token');
        });
        
        it('should return 401 if session is invalid or expired', async () => {
            mockedExtractToken.mockReturnValue('validtoken');
            mockedValidateToken.mockReturnValue({ isValid: true, decoded: { sessionId: '123', pki: 'user1' } });
            mockedSessionFindOne.mockResolvedValue(null);
            const response = await request(app).put(path).set('Authorization', 'Bearer validtoken').send(updateData);
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid or expired session');
        });

        describe('with valid token', () => {
            beforeEach(() => {
                mockedExtractToken.mockReturnValue('validtoken');
                mockedValidateToken.mockReturnValue({ isValid: true, decoded: { sessionId: '123', pki: 'user1' } });
                mockedSessionFindOne.mockResolvedValue({ valid: true });
            });

            it('should return 404 if user to update is not found', async () => {
                mockedUserFindOne.mockResolvedValue(null);
                const response = await request(app)
                    .put(path)
                    .set('Authorization', 'Bearer validtoken')
                    .send(updateData);
                
                expect(response.status).toBe(404);
                expect(response.body.message).toBe('User not found');
            });

            it('should return 200 and updated user data on success', async () => {
                const originalUser = { pki, name: 'Original Name', email: 'original@test.com', role: 'user', password: 'oldpassword', active: true };
                const updatedUser = { ...originalUser, ...updateData };
                mockedUserFindOne.mockResolvedValue(originalUser);
                mockedUserFindOneAndUpdate.mockResolvedValue(updatedUser);

                const response = await request(app)
                    .put(path)
                    .set('Authorization', 'Bearer validtoken')
                    .send(updateData);
                
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('User updated');
                expect(response.body.user).toEqual({
                    name: updatedUser.name,
                    email: updatedUser.email,
                    active: updatedUser.active
                });
                expect(mockedUserFindOne).toHaveBeenCalledWith({ pki });
                expect(mockedUserFindOneAndUpdate).toHaveBeenCalled();
            });

            it('should hash password if provided', async () => {
                const originalUser = { pki, name: 'Original Name', email: 'original@test.com', role: 'user', password: 'oldpassword', active: true };
                const passwordData = { password: 'newpassword' };
                const updatedUserWithNewPassword = { ...originalUser, password: 'hashed_newpassword' };

                mockedUserFindOne.mockResolvedValue(originalUser);
                mockedUserFindOneAndUpdate.mockResolvedValue(updatedUserWithNewPassword);
                
                await request(app)
                    .put(path)
                    .set('Authorization', 'Bearer validtoken')
                    .send(passwordData);

                expect(mockedUserFindOneAndUpdate).toHaveBeenCalledWith(
                    {pki: pki}, 
                    {$set: expect.objectContaining({ password: 'hashed_newpassword' })},
                    {new: true}
                );
            });
        });
    });
});
