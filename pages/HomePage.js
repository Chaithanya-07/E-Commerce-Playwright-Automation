const { BasePage } = require('./BasePage');

/**
 * HomePage models the landing page. Navigation and login state live in
 * BasePage because the navbar is shared; what is left here is homepage content.
 */
class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.heroHeading = page.getByTestId('hero-heading');
    this.browseProductsButton = page.getByTestId('browse-products-button');
  }

  async goto() {
    await this.page.goto('/');
  }
}

module.exports = { HomePage };
