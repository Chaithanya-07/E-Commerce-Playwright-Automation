const { test: authTest, expect } = require('./auth.fixture');
const crypto = require('crypto');
const { getValidUser } = require('../utils/testData');
const authApi = require('../api/authApi');
const cartApi = require('../api/cartApi');

/**
 * api.fixture adds two API-side fixtures on top of the existing
 * authenticatedPage fixture. Both are lazy: a test that does not request
 * them never pays for them, so pure API tests using this file spin up no
 * browser at all.
 *
 * - apiAuth      logs in through the API once and provides
 *                { accessToken, user }. The token lives only in test
 *                memory - it is never logged, saved or committed.
 *
 * - cartSession  a brand-new random session id, so every test gets its own
 *                isolated server-side cart (the API keys carts by the
 *                X-Session-ID header, not by the logged-in user). After the
 *                test the cart is cleared as cleanup - safe even when order
 *                creation has already emptied it, because DELETE /api/cart
 *                succeeds on an empty cart.
 */

const apiTest = authTest.extend({
  apiAuth: async ({ request }, use) => {
    const user = getValidUser();
    const response = await authApi.login(request, user.username, user.password);
    if (response.status() !== 200) {
      throw new Error(`API login failed with status ${response.status()}`);
    }
    const { data } = await response.json();
    await use(data);
  },

  cartSession: async ({ request }, use) => {
    // Same format the site itself uses for localStorage "session_id".
    const sessionId = crypto.randomUUID();
    await use(sessionId);

    // Cleanup after the test, whatever happened inside it. Best-effort:
    // a failed cleanup must not mask a test failure already thrown.
    await cartApi.clearCart(request, sessionId).catch(() => {});
  },
});

module.exports = { test: apiTest, expect };