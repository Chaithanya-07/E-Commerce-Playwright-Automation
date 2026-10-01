const { test, expect } = require('../../fixtures/api.fixture');
const productsApi = require('../../api/productsApi');
const cartApi = require('../../api/cartApi');
const ordersApi = require('../../api/ordersApi');
const { OrdersPage } = require('../../pages/OrdersPage');
const { getProducts } = require('../../utils/testData');

const speaker = getProducts().inStock.bluetoothSpeaker;
const { shipping, payment } = getProducts().checkout;

/**
 * The API -> UI hybrid scenario.
 *
 * Everything before the UI step happens through the API, and the UI is then
 * used only to prove the customer would actually see the result. This is
 * the interview point of Phase 5: API setup is faster and more stable than
 * UI setup, and verifying through the UI also proves the two layers agree.
 *
 *   1. API: log in                       (apiAuth fixture, token in memory)
 *   2. API: fetch the product by id      (price comes from the server, not
 *                                         a hard-coded number)
 *   3. API: add it to a fresh cart       (cartSession fixture, isolated)
 *   4. API: place the order              -> 201, dynamic order id
 *   5. UI : open My Orders, find the order by that dynamic id
 *   6. API: read the order back           (same state from both layers)
 *
 * Why the cart is seeded via API but verified through the *order* history:
 * QADemo's cart page renders from localStorage, not from the server, so an
 * API-prepared cart alone would never appear in the UI honestly. Orders,
 * however, are real server-side state that the UI fetches via
 * GET /api/orders - which makes the verification genuine end to end.
 */
test.describe('API -> UI hybrid', () => {
  test('an order created through the API appears in the UI order history', async ({
    authenticatedPage: page,
    request,
    apiAuth,
    cartSession,
  }) => {
    // 1+2. Product details come straight from the API - the live price and
    // name are the source of truth the assertions are built on.
    const productResponse = await productsApi.getProductById(request, speaker.id);
    expect(productResponse.status()).toBe(200);
    const { data: product } = await productResponse.json();
    expect(product.name).toBe(speaker.name);

    const quantity = 2;

    // 3. Seed an isolated server-side cart for this test only.
    const addResponse = await cartApi.addCartItem(request, cartSession, product.id, quantity);
    expect(addResponse.status()).toBe(200);

    // 4. Place the order. The API schema calls the expiry field
    // "expiryDate" where the UI labels it "expiry" - mapped here, once.
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
    const { data: order } = await orderResponse.json();

    // A dynamic id from the response - never a number typed into the test.
    expect(order.id).toBeGreaterThan(0);
    expect(order.totalAmount).toBeCloseTo(product.price * quantity, 2);

    // 5. The UI side: the same signed-in account opens My Orders.
    const ordersPage = new OrdersPage(page);
    await ordersPage.goto();

    await expect(ordersPage.orderNumber(order.id)).toHaveText(`Order #${order.id}`);
    await expect(ordersPage.orderTotal(order.id)).toHaveText(`$${order.totalAmount.toFixed(2)}`);
    await expect(ordersPage.orderCustomer(order.id)).toHaveText(
      `${shipping.firstName} ${shipping.lastName}`
    );

    // 6. Cross-check from the API layer: the backend still holds the same
    // state the UI just showed.
    const fetchResponse = await ordersApi.getOrderById(request, apiAuth.accessToken, order.id);
    expect(fetchResponse.status()).toBe(200);
    const { data: fetchedOrder } = await fetchResponse.json();
    expect(fetchedOrder.id).toBe(order.id);
    expect(fetchedOrder.status).toBe('pending');
    expect(fetchedOrder.totalAmount).toBe(order.totalAmount);

    // Cleanup is already handled: placing the order consumed the cart, and
    // the cartSession fixture clears anything left as a safety net. Orders
    // themselves cannot be deleted - see the README's known limitations.
  });
});