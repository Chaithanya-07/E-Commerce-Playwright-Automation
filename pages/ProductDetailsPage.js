const { BasePage } = require('./BasePage');

/**
 * ProductDetailsPage models /products/{slug}.
 * Holds the product information displayed and the add-to-cart action.
 */
class ProductDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.name = page.getByTestId('product-detail-name');
    this.price = page.getByTestId('product-detail-price');
    this.description = page.getByTestId('product-detail-description');
    this.addToCartButton = page.getByTestId('product-add-to-cart-button');
    this.backToCatalogLink = page.getByTestId('product-back-to-catalog');
  }

  async goto(slug) {
    await this.page.goto(`/products/${slug}`);
  }

  /** Waits for the cart API call so the caller can safely navigate afterwards. */
  async addToCart() {
    await this.clickAndAwaitAddToCart(() => this.addToCartButton.click());
  }
}

module.exports = { ProductDetailsPage };
