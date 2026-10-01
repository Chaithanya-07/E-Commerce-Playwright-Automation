const { BasePage } = require('./BasePage');

/**
 * SignupPage models /signup.
 * It knows how to fill in and submit the registration form - nothing more.
 */
class SignupPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByTestId('signup-heading');
    this.emailInput = page.getByTestId('email-input');
    this.phoneInput = page.getByTestId('phone-input');
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.submitButton = page.getByTestId('signup-submit-button');
    this.signInLink = page.getByTestId('sign-in-link');

    /*
     * QADemo renders these validation errors as plain text without their own
     * data-testid, so they are matched by message.
     */
    this.passwordMismatchError = page.getByText('Passwords do not match');
    this.duplicateEmailError = page.getByText(
      'An account with this email address already exists. Please sign in instead.'
    );
  }

  async goto() {
    await this.page.goto('/signup');
  }

  /**
   * Username is optional on QADemo (it is auto-generated when left empty),
   * so it is only filled when the caller supplies one.
   * confirmPassword defaults to the same value as password.
   */
  async fillRegistrationForm({ email, phone, username, password, confirmPassword = password }) {
    await this.emailInput.fill(email);
    await this.phoneInput.fill(phone);
    if (username) {
      await this.usernameInput.fill(username);
    }
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  async submitRegistration() {
    await this.submitButton.click();
  }
}

module.exports = { SignupPage };
