/**
 * ordersApi - API calls for /api/orders.
 *
 * Verified against the live API:
 * - GET /api/orders      needs "Authorization: Bearer <token>" -> 200, array
 * - GET /api/orders/:id  needs the same header                 -> 200, one order
 * - POST /api/orders     needs the Bearer header AND X-Session-ID,
 *   body { shipping: { firstName, lastName, address },
 *          payment:  { cardNumber, expiryDate, cvv, cardholderName } }
 *   -> 201 with the created order, including its dynamic id.
 *
 * The server builds the order from the session's cart, so a test can create
 * an order purely through the API by seeding the cart first (cartApi).
 * Order creation consumes the cart - the session's cart is empty afterwards.
 */

const AUTH_HEADERS = (accessToken) => ({ Authorization: `Bearer ${accessToken}` });

/** Lists the signed-in user's orders, newest first. */
async function getOrders(request, accessToken) {
  return request.get('/api/orders', { headers: AUTH_HEADERS(accessToken) });
}

/** Returns one of the user's own orders. Another user's id returns 404. */
async function getOrderById(request, accessToken, orderId) {
  return request.get(`/api/orders/${orderId}`, {
    headers: AUTH_HEADERS(accessToken),
  });
}

/**
 * Places an order from the session's server-side cart.
 * `shipping` and `payment` follow the request schema documented at the top
 * of this file; the test maps them from test-data/products.json.
 */
async function createOrder(request, accessToken, sessionId, shipping, payment) {
  return request.post('/api/orders', {
    headers: { ...AUTH_HEADERS(accessToken), 'X-Session-ID': sessionId },
    data: { shipping, payment },
  });
}

module.exports = { getOrders, getOrderById, createOrder };