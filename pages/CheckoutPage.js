const { BasePage } = require('./BasePage');

/**
 * CheckoutPage models /checkout.
 *
 * The checkout journey ends on the order confirmation screen, so those
 * locators live here too rather than in a separate page object - a test can
 * walk from "place order" straight to "assert the confirmation".
 */
class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByTestId('checkout-heading');

    // Shipping information
    this.firstNameInput = page.getByTestId('checkout-first-name');
    this.lastNameInput = page.getByTestId('checkout-last-name');
    this.addressInput = page.getByTestId('checkout-address');

    // Payment information
    this.cardNumberInput = page.getByTestId('checkout-card-number');
    this.expiryInput = page.getByTestId('checkout-expiry');
    this.cvvInput = page.getByTestId('checkout-cvv');
    this.cardholderNameInput = page.getByTestId('checkout-cardholder-name');

    this.placeOrderButton = page.getByTestId('place-order-button');

    // Order confirmation
    this.confirmationHeading = page.getByTestId('order-confirmation-heading');
    this.confirmationNumber = page.getByTestId('order-confirmation-number');
    this.orderShippingName = page.getByTestId('order-shipping-name');
    this.orderShippingAddress = page.getByTestId('order-shipping-address');
  }

  async fillShippingInfo({ firstName, lastName, address }) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.addressInput.fill(address);
  }

  async fillPaymentInfo({ cardNumber, expiry, cvv, cardholderName }) {
    await this.cardNumberInput.fill(cardNumber);
    await this.expiryInput.fill(expiry);
    await this.cvvInput.fill(cvv);
    await this.cardholderNameInput.fill(cardholderName);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}

module.exports = { CheckoutPage };
