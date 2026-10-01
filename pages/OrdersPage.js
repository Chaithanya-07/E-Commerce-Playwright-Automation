const { BasePage } = require('./BasePage');

/**
 * OrdersPage models /orders - the "My Orders" history.
 *
 * This page only exists for a signed-in customer: the navbar shows the
 * "My Orders" link, and /orders itself redirects to the login screen when
 * opened without a session, so this page object is only used together with
 * the authenticatedPage fixture.
 *
 * Every order row is keyed by the order's dynamic id, e.g. the test ids are
 * order-item-1992, order-number-1992, order-total-1992. The id always comes
 * from the API response that created the order - never a hard-coded number,
 * because ids are assigned by the server and differ every run.
 */
class OrdersPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByTestId('orders-heading');
    this.welcome = page.getByTestId('orders-welcome');
  }

  async goto() {
    await this.page.goto('/orders');
  }

  /** The whole row for one order. */
  orderItem(orderId) {
    return this.page.getByTestId(`order-item-${orderId}`);
  }

  orderNumber(orderId) {
    return this.page.getByTestId(`order-number-${orderId}`);
  }

  orderDate(orderId) {
    return this.page.getByTestId(`order-date-${orderId}`);
  }

  orderTotal(orderId) {
    return this.page.getByTestId(`order-total-${orderId}`);
  }

  orderCustomer(orderId) {
    return this.page.getByTestId(`order-customer-${orderId}`);
  }
}

module.exports = { OrdersPage };