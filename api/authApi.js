/**
 * authApi - API calls for /api/auth.
 *
 * Verified against the live API: POST /api/auth/login accepts a JSON body
 * { username, password } and returns 200 with
 * { success, data: { accessToken, user: { id, username, userType, ... } } }.
 * The accessToken is then sent as an "Authorization: Bearer <token>" header
 * by the other API helpers (ordersApi). Wrong credentials return 401 with
 * error code INVALID_CREDENTIALS.
 *
 * Every function takes Playwright's `request` context, so the calls reuse
 * the framework's configured baseURL - no absolute URLs anywhere.
 */

/** Logs in through the API and returns the raw response. */
async function login(request, username, password) {
  return request.post('/api/auth/login', {
    data: { username, password },
  });
}

module.exports = { login };