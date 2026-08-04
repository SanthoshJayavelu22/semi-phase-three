// backend/src/__tests__/health.test.ts
import request from 'supertest';
import express from 'express';
import healthRoutes from '../routes/healthRoutes';

const app = express();
app.use('/api/health', healthRoutes);

describe('System Health Check Suite', () => {
  it('should return health status JSON response when requested', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toHaveProperty('database');
  });
});
