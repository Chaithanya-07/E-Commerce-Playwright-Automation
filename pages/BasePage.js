const { expect } = require('@playwright/test');

/**
 * BasePage holds the parts of the UI that every QADemo page renders: the navbar.
 *
 * This is the first thing POM pays off for - the navbar is shared chrome, so it
 * is described once here instead of being repeated across seven page objects.
 * Each page object extends this and adds only what is specific to its screen.
 */
class BasePage {
  constructor(page) {
    this.page = page;

    // Navbar (present on every page)
    this.productsLink = page.getByTestId('navbar-products-link');
    this.cartLink = page.getByTestId('navbar-cart-link');
    this.cartBadge = page.getByTestId('navbar-cart-badge');
    this.signInLink = page.getByTestId('navbar-signin-link');
    this.signUpLink = page.getByTestId('navbar-signup-link');
    this.username = page.getByTestId('navbar-username');
    this.logoutButton = page.getByTestId('navbar-logout-button');
  }

  /**
   * Adding to the cart is an asynchronous request. Waiting for the badge to
   * reach the expected number is what makes "add to cart" safe to follow with a
   * navigation - without it a test can reach the cart page before the request
   * has been accepted and see an empty cart.
   */
  async expectCartCount(expected) {
    await expect(this.cartBadge).toHaveText(String(expected));
  }

  /**
   * Clicks a cart control and waits for its API call to come back OK.
   *
   * Two timing realities of QADemo are handled here:
   *
   * 1. The navbar badge updates optimistically the moment "Add" is clicked,
   *    but the item is only persisted when the cart API succeeds. Navigating
   *    to the cart before that response arrives cancels the request and the
   *    item is lost - the response is the real "saved" signal.
   *
   * 2. QADemo is a single-page app. A click that lands before the page has
   *    finished booting its JavaScript is silently ignored - no request is
   *    sent at all. Firefox and WebKit resolve page load slightly earlier
   *    than the app attaches its click handlers, so a first click can vanish
   *    this way (the button looks and behaves as clickable in the DOM, so no
   *    assertion can tell the difference - only the missing API call can).
   *    The retry below clicks again in that case, up to three bounded,
   *    response-driven attempts.
   *
   * `stateUnchanged` reports whether the click had any visible effect (badge
   * count, quantity text, row presence). Between attempts it decides whether
   * to click again - a click that was accepted but is still in flight must
   * never be applied twice.
   */
  async clickAndAwaitCartApi(clickAction, method, stateUnchanged) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const cartApiCall = this.page.waitForResponse(
        (response) =>
          response.url().includes('/api/cart/items') &&
          response.request().method() === method &&
          response.ok(),
        { timeout: 5000 }
      );

      if (attempt === 1 || (await stateUnchanged())) {
        await clickAction();
      }

      if (await cartApiCall.catch(() => null)) {
        return;
      }
    }

    throw new Error(
      `Cart operation (${method}) never completed: no successful /api/cart/items call was observed`
    );
  }

  /**
   * Adds an item to the cart and waits until the app has actually recorded it.
   * The badge count is the visible effect used to avoid a double add.
   */
  async clickAndAwaitAddToCart(clickAction) {
    const cartBefore = await this.cartCount();
    const cartStorageBefore = await this.page.evaluate(
      () => localStorage.getItem('cart-storage')
    );

    await this.clickAndAwaitCartApi(clickAction, 'POST', async () => {
      return (await this.cartCount()) === cartBefore;
    });

    /*
     * Seeing the POST succeed is still not the whole story: QADemo keeps the
     * cart in localStorage and writes it from the page's own response
     * handler, which runs a moment after the HTTP response becomes visible
     * to Playwright. Navigating to the cart inside that moment destroys the
     * pending write and the cart page shows empty (observed on WebKit under
     * full parallel load). Waiting until the stored cart really changed
     * closes that gap before the caller navigates anywhere.
     */
    await this.page.waitForFunction(
      (stored) => localStorage.getItem('cart-storage') !== stored,
      cartStorageBefore,
      { timeout: 5000 }
    );
  }

  /** The number currently shown in the navbar cart badge. */
  async cartCount() {
    /*
     * QADemo only renders the badge once something is in the cart - with an
     * empty cart the navbar shows just the cart icon. An absent badge means
     * "0", not "element missing", so this must not wait for it to appear.
     */
    if (!(await this.cartBadge.count())) {
      return 0;
    }
    const count = Number(await this.cartBadge.textContent());
    return Number.isNaN(count) ? -1 : count;
  }

  async goToLogin() {
    await this.signInLink.click();
  }

  async goToSignup() {
    await this.signUpLink.click();
  }

  async goToProducts() {
    await this.productsLink.click();
  }

  async goToCart() {
    await this.cartLink.click();
  }

  async logout() {
    await this.logoutButton.click();
  }

  /** The navbar shows a username and a logout control once a user is signed in. */
  async expectLoggedInAs(username) {
    await expect(this.username).toHaveText(username);
    await expect(this.logoutButton).toBeVisible();
  }
}

module.exports = { BasePage };
