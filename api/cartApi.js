/**
 * cartApi - API calls for /api/cart.
 *
 * Verified against the live API, and the key detail the whole cart layer
 * depends on: the server identifies the shopper by the X-Session-ID header,
 * NOT by the login token. A request with only an Authorization header is
 * rejected with 400 "Missing X-Session-ID header". In the UI the browser
 * generates this session id and keeps it in localStorage under the key
 * "session_id"; the API tests simply generate their own (see the
 * cartSession fixture), which keeps every test's cart isolated.
 *
 * - POST /api/cart/items  body { productId, quantity }  -> 200
 * - GET  /api/cart                                            -> 200, cart contents
 * - DELETE /api/cart (clear)                                  -> 200, { cleared: true }
 */

const SESSION_HEADERS = (sessionId) => ({ 'X-Session-ID': sessionId });

/** Returns the current cart for a session: items, totalItems, totalAmount. */
async function getCart(request, sessionId) {
  return request.get('/api/cart', { headers: SESSION_HEADERS(sessionId) });
}

/** Adds a product to the session's server-side cart. */
async function addCartItem(request, sessionId, productId, quantity) {
  return request.post('/api/cart/items', {
    headers: SESSION_HEADERS(sessionId),
    data: { productId, quantity },
  });
}

/** Removes every item from the session's cart. Safe on an empty cart too. */
async function clearCart(request, sessionId) {
  return request.delete('/api/cart', { headers: SESSION_HEADERS(sessionId) });
}

module.exports = { getCart, addCartItem, clearCart };