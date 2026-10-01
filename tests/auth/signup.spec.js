const { test, expect } = require('@playwright/test');
const { SignupPage } = require('../../pages/SignupPage');
const { HomePage } = require('../../pages/HomePage');
const { generateSignupUser } = require('../../utils/testData');

test.describe('Sign up', () => {
  test('a new user can register and lands logged in', async ({ page }) => {
    const signupPage = new SignupPage(page);
    const homePage = new HomePage(page);
    const user = generateSignupUser();

    await signupPage.goto();
    await expect(signupPage.heading).toHaveText('Create an Account');

    await signupPage.fillRegistrationForm(user);
    await signupPage.submitRegistration();

    // Registration signs the user straight in and redirects to the catalog.
    await expect(page).toHaveURL(/\/catalog$/);
    await homePage.expectLoggedInAs(user.username);
  });

  test('registration is rejected when the passwords do not match', async ({ page }) => {
    const signupPage = new SignupPage(page);
    const user = generateSignupUser();

    await signupPage.goto();
    await signupPage.fillRegistrationForm({ ...user, confirmPassword: 'Mismatch@999' });
    await signupPage.submitRegistration();

    await expect(page).toHaveURL(/\/signup$/);
    await expect(signupPage.passwordMismatchError).toBeVisible();
  });

  test('registration is rejected when the email is already registered', async ({ page }) => {
    const signupPage = new SignupPage(page);
    const homePage = new HomePage(page);
    const user = generateSignupUser();

    // Register the account once.
    await signupPage.goto();
    await signupPage.fillRegistrationForm(user);
    await signupPage.submitRegistration();
    await expect(page).toHaveURL(/\/catalog$/);

    // Sign out, then try to register the same email again.
    await homePage.logout();
    await signupPage.goto();
    await signupPage.fillRegistrationForm(user);
    await signupPage.submitRegistration();

    await expect(page).toHaveURL(/\/signup$/);
    await expect(signupPage.duplicateEmailError).toBeVisible();
  });
});
