const { test, expect } = require('@playwright/test');
const { CartPage } = require('../../pages/CartPage');
const { ProductDetailsPage } = require('../../pages/ProductDetailsPage');
const { HomePage } = require('../../pages/HomePage');
const { getProducts } = require('../../utils/testData');

const products = getProducts();
const tracker = products.inStock.fitnessTracker;

test.describe('Cart', () => {
  test('an empty cart shows the empty state', async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.goto();

    await expect(cartPage.emptyHeading).toHaveText('Your cart is empty');
    await expect(cartPage.emptyState).toBeVisible();
    await expect(cartPage.proceedToCheckoutButton).toHaveCount(0);
  });

  test.describe('with a product in the cart', () => {
    let cartPage;

    // Hook: these four tests all start from the same arrangement - the fitness
    // tracker in the cart, cart page open. beforeEach is used instead of a
    // shared helper call in each test, and instead of beforeAll so every test
    // still gets a fresh browser context and stays fully independent.
    test.beforeEach(async ({ page }) => {
      const productDetailsPage = new ProductDetailsPage(page);
      cartPage = new CartPage(page);

      await productDetailsPage.goto(tracker.slug);
      await productDetailsPage.addToCart();
      await cartPage.goto();
    });

    test('an added product appears in the cart with its price', async () => {
      await expect(cartPage.heading).toHaveText('Shopping Cart');
      await expect(cartPage.cartItem(tracker.name)).toBeVisible();
      await expect(cartPage.quantity(tracker.name)).toHaveText('1');
      await expect(cartPage.subtotalFor(tracker.name)).toHaveText(tracker.price);
      await expect(cartPage.total).toHaveText(tracker.price);
    });

    test('increasing the quantity updates the item subtotal and the order total', async ({ page }) => {
      const homePage = new HomePage(page);

      await cartPage.increaseQuantity(tracker.name);

      // $89.99 x 2 = $179.98
      await expect(cartPage.quantity(tracker.name)).toHaveText('2');
      await expect(cartPage.subtotalFor(tracker.name)).toHaveText('$179.98');
      await expect(cartPage.total).toHaveText('$179.98');
      await homePage.expectCartCount(2);
    });

    test('decreasing the quantity brings the subtotal back down', async () => {
      await cartPage.increaseQuantity(tracker.name);
      await expect(cartPage.quantity(tracker.name)).toHaveText('2');

      await cartPage.decreaseQuantity(tracker.name);

      await expect(cartPage.quantity(tracker.name)).toHaveText('1');
      await expect(cartPage.subtotalFor(tracker.name)).toHaveText(tracker.price);
    });

    test('removing the last item returns the cart to its empty state', async () => {
      await cartPage.removeItem(tracker.name);

      await expect(cartPage.emptyState).toBeVisible();
      await expect(cartPage.emptyHeading).toHaveText('Your cart is empty');
    });
  });
});