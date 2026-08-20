process.env.NODE_ENV = 'test';
require('./setup');
const request = require('supertest');
const app = require('../server');

describe('Transactions', () => {
  const userPayload = {
    name: 'Tx User',
    email: 'txuser@example.com',
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
  };

  let token;
  let categoryId;
  let paymentMethodId;

  beforeEach(async () => {
    const registerRes = await request(app).post('/api/auth/register').send(userPayload);
    token = registerRes.body.data.token;

    const catRes = await request(app).get('/api/categories?type=expense').set('Authorization', `Bearer ${token}`);
    categoryId = catRes.body.data.categories[0]._id;

    const pmRes = await request(app).get('/api/payment-methods').set('Authorization', `Bearer ${token}`);
    paymentMethodId = pmRes.body.data.paymentMethods[0]._id;
  });

  it('creates a transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 150,
        category: categoryId,
        paymentMethod: paymentMethodId,
        description: 'Lunch',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.transaction.amount).toBe(150);
  });

  it('fetches transactions list', async () => {
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 100, category: categoryId, paymentMethod: paymentMethodId });

    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.transactions.length).toBe(1);
  });

  it('updates a transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 100, category: categoryId, paymentMethod: paymentMethodId });
    const id = createRes.body.data.transaction._id;

    const res = await request(app)
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 200 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.transaction.amount).toBe(200);
  });

  it('deletes a transaction', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 100, category: categoryId, paymentMethod: paymentMethodId });
    const id = createRes.body.data.transaction._id;

    const res = await request(app).delete(`/api/transactions/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);

    const getRes = await request(app).get(`/api/transactions/${id}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toBe(404);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toBe(401);
  });
});
