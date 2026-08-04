import request from 'supertest';
import app from '../index';
import { User } from '../models/userModel';

describe('Authentication API', () => {
  let testUser: any;

  beforeEach(async () => {
    await User.deleteMany({});
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      isEmailVerified: true,
      role: 'institute',
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with tokens for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctPassword',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 for unverified email', async () => {
      await User.findByIdAndUpdate(testUser._id, { isEmailVerified: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/verify.*email/i);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should create a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.data.user).toHaveProperty('isEmailVerified', false);
    });

    it('should return 400 for duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: 'test@example.com',
          password: 'Password123!',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another',
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/already exists/i);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Password',
          email: 'weak@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/password/i);
    });
  });
});
