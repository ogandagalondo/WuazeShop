import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server.js';

describe('Server Healthcheck', () => {
  it('GET /api/health returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'WuazeShop' });
  });
});
