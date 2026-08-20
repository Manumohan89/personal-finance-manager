process.env.NODE_ENV = 'test';
require('./setup');
const request = require('supertest');
const app = require('../server');

describe('Auth', () => {
  const userPayload = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
  };

  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(userPayload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app).post('/api/auth/register').send(userPayload);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userPayload.email, password: userPayload.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(userPayload);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userPayload.email, password: 'WrongPass1!' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('marks a newly registered user as needing onboarding and allows completion', async () => {
    const registerRes = await request(app).post('/api/auth/register').send(userPayload);
    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body.data.user.onboardingCompleted).toBe(false);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userPayload.email, password: userPayload.password });

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`)
      .send({ currency: 'USD', monthlyIncome: 4000, onboardingCompleted: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.currency).toBe('USD');
    expect(res.body.data.user.monthlyIncome).toBe(4000);
    expect(res.body.data.user.onboardingCompleted).toBe(true);
  });
});
