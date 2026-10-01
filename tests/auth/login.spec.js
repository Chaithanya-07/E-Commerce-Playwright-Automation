const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { HomePage } = require('../../pages/HomePage');
const { getValidUser } = require('../../utils/testData');

test.describe('Login', () => {
  let loginPage;

  // Hook: every login test starts from the same place - the login page open
  // and ready. beforeEach (not beforeAll) keeps each test independent: it
  // runs in its own browser context with no session shared between tests.
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('a valid user can log in', async ({ page }) => {
    const homePage = new HomePage(page);
    const user = getValidUser();

    await expect(loginPage.heading).toHaveText('Welcome Back');

    await loginPage.login(user.username, user.password);

    await expect(page).toHaveURL(/\/catalog$/);
    await homePage.expectLoggedInAs(user.displayName);
  });

  test('login is rejected when the password is wrong', async ({ page }) => {
    const user = getValidUser();

    await loginPage.login(user.username, 'WrongPass@999');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.invalidCredentialsError).toBeVisible();
  });

  test('login is rejected for a user that does not exist', async ({ page }) => {
    await loginPage.login('no.such.user@example.com', 'SomePass@123');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.invalidCredentialsError).toBeVisible();
  });

  test('required field validation is shown when the form is submitted empty', async ({ page }) => {
    // login() skips empty fields, so this submits the form completely empty.
    await loginPage.login('', '');

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.usernameRequiredError).toBeVisible();
    await expect(loginPage.passwordRequiredError).toBeVisible();
  });
});