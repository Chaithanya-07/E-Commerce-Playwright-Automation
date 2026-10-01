const { BasePage } = require('./BasePage');

/**
 * ProductsPage models the /catalog listing.
 *
 * QADemo gives every catalog card a numeric id (product-card-4, product-price-4,
 * ...), but a test should not hard-code those ids. Instead each card is found by
 * the product name a customer would recognise, and the id-specific test ids are
 * looked up *inside* that card. That keeps tests readable as business steps and
 * stops them breaking when the catalog is re-ordered.
 */
class ProductsPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByTestId('catalog-heading');
    this.productCountText = page.getByTestId('catalog-product-count');
    this.productGrid = page.getByTestId('product-grid');
  }

  async goto() {
    await this.page.goto('/catalog');
  }

  /** The card whose product name matches exactly (case-sensitive, whole string). */
  productCard(productName) {
    return this.productGrid
      .locator('[data-testid^="product-card-"]')
      .filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  productPrice(productName) {
    return this.productCard(productName).locator('[data-testid^="product-price-"]');
  }

  addToCartButton(productName) {
    return this.productCard(productName).locator('[data-testid^="product-add-to-cart-"]');
  }

  outOfStockBadge(productName) {
    return this.productCard(productName).locator('[data-testid^="product-out-of-stock-badge-"]');
  }

  async addToCart(productName) {
    await this.clickAndAwaitAddToCart(() => this.addToCartButton(productName).click());
  }

  async openProduct(productName) {
    await this.productCard(productName).locator('[data-testid^="product-link-"]').click();
  }
}

module.exports = { ProductsPage };
