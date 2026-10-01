const { test, expect } = require('../../fixtures/api.fixture');
const authApi = require('../../api/authApi');
const { getValidUser } = require('../../utils/testData');

const validUser = getValidUser();

test.describe('Auth API', () => {
  test('login with valid credentials returns an access token and the user', async ({ request }) => {
    const response = await authApi.login(request, validUser.username, validUser.password);

    expect(response.status()).toBe(200);
    const { success, data } = await response.json();

    expect(success).toBe(true);

    // The token is what the orders endpoints expect as a Bearer header.
    expect(typeof data.accessToken).toBe('string');
    expect(data.accessToken.length).toBeGreaterThan(0);

    // users.json stores the account's email, which both the UI login form
    // and the API accept as the username. The response echoes it as
    // user.email and also carries the account's chosen username.
    expect(data.user.email).toBe(validUser.username);
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('userType');
  });

  test('login with a wrong password returns 401 INVALID_CREDENTIALS', async ({ request }) => {
    const response = await authApi.login(request, validUser.username, 'WrongPass@123');

    expect(response.status()).toBe(401);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
    expect(body.error.message).toBe('Invalid username or password');
  });

  test('a standard user token is rejected by admin endpoints', async ({ request, apiAuth }) => {
    /*
     * Observed on the live API: an admin endpoint called with a valid but
     * standard-user token answers 401 "Invalid token" - the same status as
     * no token at all, not 403. Documenting the actual behaviour is the
     * point of this negative test.
     */
    const response = await request.get('/api/admin/stats', {
      headers: { Authorization: `Bearer ${apiAuth.accessToken}` },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.error.message).toBe('Invalid token');
  });
});