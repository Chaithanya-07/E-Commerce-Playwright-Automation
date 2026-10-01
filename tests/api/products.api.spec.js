const { test, expect } = require('../../fixtures/api.fixture');
const productsApi = require('../../api/productsApi');
const { getProducts } = require('../../utils/testData');

const speaker = getProducts().inStock.bluetoothSpeaker;

test.describe('Products API', () => {
  test('the catalogue endpoint returns a list of products with the expected fields', async ({ request }) => {
    const response = await productsApi.getAllProducts(request);

    expect(response.status()).toBe(200);
    const { success, data } = await response.json();

    expect(success).toBe(true);
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // Every product carries the fields the framework relies on.
    const first = data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('slug');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('stock');

    // The catalogue includes the product the UI tests are built around.
    const found = data.find((product) => product.name === speaker.name);
    expect(found).toBeTruthy();
    expect(found.id).toBe(speaker.id);
  });

  test('a product can be fetched by its numeric id', async ({ request }) => {
    const response = await productsApi.getProductById(request, speaker.id);

    expect(response.status()).toBe(200);
    const { data } = await response.json();

    expect(data.id).toBe(speaker.id);
    expect(data.name).toBe(speaker.name);
    expect(data.slug).toBe(speaker.slug);
    expect(typeof data.price).toBe('number');
    expect(typeof data.stock).toBe('number');
  });

  test('an unknown product id returns 404 with a NOT_FOUND error code', async ({ request }) => {
    const response = await productsApi.getProductById(request, 999999);

    expect(response.status()).toBe(404);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Product not found');
  });
});