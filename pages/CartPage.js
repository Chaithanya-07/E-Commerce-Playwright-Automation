const { BasePage } = require('./BasePage');

/**
 * CartPage models /cart - both the populated cart and the empty state.
 *
 * A cart row has the test id `cart-item-<productId>`. The numeric pattern below
 * is deliberate: the `^cart-item-\d+$` regex matches the row itself while
 * excluding `cart-item-count` and the nested quantity/price elements, which a
 * plain `startsWith` selector would also catch.
 */
class CartPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByTestId('cart-heading');
    this.itemCountText = page.getByTestId('cart-item-count');
    this.clearCartButton = page.getByTestId('clear-cart-button');

    // Empty state
    this.emptyState = page.getByTestId('cart-empty-state');
    this.emptyHeading = page.getByTestId('cart-empty-heading');

    // Order summary
    this.subtotal = page.getByTestId('order-subtotal');
    this.shipping = page.getByTestId('order-shipping');
    this.total = page.getByTestId('order-total');

    this.proceedToCheckoutButton = page.getByTestId('proceed-to-checkout-button');
  }

  async goto() {
    await this.page.goto('/cart');
  }

  /** The cart row for a given product name. */
  cartItem(productName) {
    return this.page
      .getByTestId(/^cart-item-\d+$/)
      .filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  quantity(productName) {
    return this.cartItem(productName).getByTestId(/^cart-item-quantity-\d+$/);
  }

  subtotalFor(productName) {
    return this.cartItem(productName).getByTestId(/^cart-item-subtotal-\d+$/);
  }

  /*
   * The quantity and remove buttons live on the cart page, which - like every
   * QADemo page - is a single-page app whose click handlers attach slightly
   * after page load. A click made too early is silently ignored (seen on
   * Firefox and WebKit under parallel load), so each operation waits for its
   * own API call and re-clicks if none came. The "stateUnchanged" check
   * (quantity text / row presence) stops an accepted-but-slow click from being
   * applied twice.
   */
  async increaseQuantity(productName) {
    const quantityBefore = await this.quantity(productName).textContent();
    await this.clickAndAwaitCartApi(
      () => this.cartItem(productName).locator('[data-testid^="cart-item-increase-"]').click(),
      'PATCH',
      async () => (await this.quantity(productName).textContent()) === quantityBefore
    );
  }

  async decreaseQuantity(productName) {
    const quantityBefore = await this.quantity(productName).textContent();
    await this.clickAndAwaitCartApi(
      () => this.cartItem(productName).locator('[data-testid^="cart-item-decrease-"]').click(),
      'PATCH',
      async () => (await this.quantity(productName).textContent()) === quantityBefore
    );
  }

  async removeItem(productName) {
    await this.clickAndAwaitCartApi(
      () => this.cartItem(productName).locator('[data-testid^="cart-item-remove-"]').click(),
      'DELETE',
      async () => (await this.cartItem(productName).count()) > 0
    );
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }
}

module.exports = { CartPage };
