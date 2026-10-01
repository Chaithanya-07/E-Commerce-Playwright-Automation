const { BasePage } = require('./BasePage');

/**
 * LoginPage models /login.
 * Exposes the login action and the error messages a negative test needs to
 * assert on, so no test has to know the selectors behind them.
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByTestId('login-heading');
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.signUpLink = page.getByTestId('sign-up-link');

    /*
     * QADemo renders validation errors as plain text without their own
     * data-testid, so these are matched by their message. Exact text keeps
     * them readable and easy to update if the wording changes.
     */
    this.invalidCredentialsError = page.getByText('Invalid username or password');
    this.usernameRequiredError = page.getByText('Username or email is required');
    this.passwordRequiredError = page.getByText('Password is required');
  }

  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Fills whichever fields are supplied and submits. Leaving both empty is a
   * valid use of this method - it drives the required-field validation test.
   */
  async login(username, password) {
    if (username) {
      await this.usernameInput.fill(username);
    }
    if (password) {
      await this.passwordInput.fill(password);
    }
    await this.submitButton.click();
  }
}

module.exports = { LoginPage };
