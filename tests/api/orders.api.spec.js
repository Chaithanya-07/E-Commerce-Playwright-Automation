const { test, expect } = require('../../fixtures/api.fixture');
const ordersApi = require('../../api/ordersApi');
const productsApi = require('../../api/productsApi');
const cartApi = require('../../api/cartApi');
const { getProducts } = require('../../utils/testData');

const speaker = getProducts().inStock.bluetoothSpeaker;
const { shipping, payment } = getProducts().checkout;

test.describe('Orders API', () => {
  test('the order history endpoint lists the account orders with expected fields', async ({
    request,
    apiAuth,
    cartSession,
  }) => {
    let response = await ordersApi.getOrders(request, apiAuth.accessToken);

    expect(response.status()).toBe(200);
    const { success, data: orders } = await response.json();

    expect(success).toBe(true);
    expect(Array.isArray(orders)).toBeTruthy();

    /*
     * Orders cannot be deleted, so the long-lived test account's history
     * only grows. But a brand-new account starts with none, and this test
     * must not depend on an earlier run having placed an order - so it
     * seeds one itself through the API when the history is empty. The
     * cartSession fixture clears the seeding cart afterwards, and the
     * order itself is one more entry in the account's history, which is
     * where the checkout and hybrid tests already leave theirs.
     */
    if (orders.length === 0) {
      const productResponse = await productsApi.getProductById(request, speaker.id);
      const { data: product } = await productResponse.json();
      await cartApi.addCartItem(request, cartSession, product.id, 1);

      const orderResponse = await ordersApi.createOrder(
        request,
        apiAuth.accessToken,
        cartSession,
        shipping,
        {
          cardNumber: payment.cardNumber,
          expiryDate: payment.expiry,
          cvv: payment.cvv,
          cardholderName: payment.cardholderName,
        }
      );
      expect(orderResponse.status()).toBe(201);

      response = await ordersApi.getOrders(request, apiAuth.accessToken);
    }

    // The endpoint answers with the account's orders, newest first.
    const { data } = await response.json();
    expect(data.length).toBeGreaterThan(0);
    const order = data[0];
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('status');
    expect(order).toHaveProperty('totalAmount');
    expect(order).toHaveProperty('createdAt');
  });

  test('the order history cannot be read without a token', async ({ request }) => {
    // Called directly with no Authorization header on purpose - the point
    // is to observe what an anonymous request actually receives.
    const response = await request.get('/api/orders');

    // Observed on the live API: missing Bearer header -> 401 UNAUTHORIZED.
    expect(response.status()).toBe(401);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Missing authentication');
  });
});