const { test, expect } = require('../../fixtures/api.fixture');
const cartApi = require('../../api/cartApi');
const { getProducts } = require('../../utils/testData');

const speaker = getProducts().inStock.bluetoothSpeaker;

/*
 * Every test here gets its own throwaway session id from the cartSession
 * fixture, so these tests share no cart state with each other or with the UI
 * suite. The fixture also clears the cart again after each test.
 */
test.describe('Cart API', () => {
  test('an item added through the API appears in the session cart', async ({ request, cartSession }) => {
    const addResponse = await cartApi.addCartItem(request, cartSession, speaker.id, 2);
    expect(addResponse.status()).toBe(200);
    const added = await addResponse.json();
    expect(added.data.productId).toBe(speaker.id);
    expect(added.data.quantity).toBe(2);
    expect(added.data.totalItems).toBe(2);

    // Reading the cart back shows the same product with its full details.
    const getResponse = await cartApi.getCart(request, cartSession);
    expect(getResponse.status()).toBe(200);
    const { data } = await getResponse.json();

    expect(data.items).toHaveLength(1);
    expect(data.items[0].productId).toBe(speaker.id);
    expect(data.items[0].quantity).toBe(2);
    expect(data.items[0].product.name).toBe(speaker.name);

    // The server computes the money values from its own product prices.
    expect(data.totalItems).toBe(2);
    expect(data.totalAmount).toBeCloseTo(data.items[0].product.price * 2, 2);
  });

  test('clearing the cart empties the session', async ({ request, cartSession }) => {
    await cartApi.addCartItem(request, cartSession, speaker.id, 1);

    const clearResponse = await cartApi.clearCart(request, cartSession);
    expect(clearResponse.status()).toBe(200);
    const cleared = await clearResponse.json();
    expect(cleared.data.cleared).toBe(true);
    expect(cleared.data.totalItems).toBe(0);

    const getResponse = await cartApi.getCart(request, cartSession);
    const { data } = await getResponse.json();
    expect(data.items).toHaveLength(0);
    expect(data.totalAmount).toBe(0);
  });

  test('adding an item without a quantity returns 400 with validation details', async ({ request, cartSession }) => {
    /*
     * quantity is deliberately omitted: JSON.stringify drops undefined
     * keys, so the request body reaches the server without a quantity
     * field at all - the same body the raw call used to build by hand,
     * but through the api layer like every other call in this file.
     */
    const response = await cartApi.addCartItem(request, cartSession, speaker.id);

    expect(response.status()).toBe(400);
    const body = await response.json();

    // The live API validates with Zod and reports the missing fields.
    expect(body.success).toBe(false);
    const missing = body.error.issues.map((issue) => issue.path.join('.'));
    expect(missing).toContain('quantity');
  });
});