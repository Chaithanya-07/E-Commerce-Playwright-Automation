const { test, expect } = require('../../fixtures/auth.fixture');
const { ProductsPage } = require('../../pages/ProductsPage');
const { CartPage } = require('../../pages/CartPage');
const { CheckoutPage } = require('../../pages/CheckoutPage');
const { getValidUser, getProducts } = require('../../utils/testData');

const user = getValidUser();
const products = getProducts();
const speaker = products.inStock.bluetoothSpeaker;
const { shipping, payment } = products.checkout;

test.describe('Checkout', () => {
  test('a logged-in customer can place an order and see the confirmation', async ({ authenticatedPage: page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // The page arrives already signed in (see fixtures/auth.fixture.js) - the
    // login steps that used to live here now happen once in auth.setup.js.
    // The navbar showing the account is the proof the reused state is valid.
    await productsPage.goto();
    await expect(productsPage.username).toHaveText(user.displayName);

    await productsPage.addToCart(speaker.name);

    await cartPage.goto();
    await expect(cartPage.cartItem(speaker.name)).toBeVisible();
    await cartPage.proceedToCheckout();

    // Fill in shipping and payment, then place the order.
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(checkoutPage.heading).toHaveText('Checkout');

    await checkoutPage.fillShippingInfo(shipping);
    await checkoutPage.fillPaymentInfo(payment);
    await checkoutPage.placeOrder();

    // The app redirects to an order confirmation for the new order number.
    await expect(page).toHaveURL(/\/orders\/\d+$/);
    await expect(checkoutPage.confirmationHeading).toHaveText('Order Confirmed!');
    await expect(checkoutPage.confirmationNumber).toHaveText(/Order #\d+/);
    await expect(checkoutPage.orderShippingName).toHaveText(
      `${shipping.firstName} ${shipping.lastName}`
    );
    await expect(checkoutPage.orderShippingAddress).toHaveText(shipping.address);
  });
});