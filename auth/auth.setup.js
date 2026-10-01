const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../pages/LoginPage');
const { getValidUser } = require('../utils/testData');

/**
 * Auth setup - the "log in once" step that every authenticated test reuses.
 *
 * This file runs as its own Playwright project (see playwright.config.js) before
 * the main chromium project. It signs in through the real UI - using the same
 * LoginPage and the same users.json credentials as always - and then saves the
 * browser's authentication state (cookies + localStorage) to a file.
 *
 * Authenticated tests never perform the login flow themselves; they start from
 * the saved state via fixtures/auth.fixture.js.
 *
 * The state file (.auth/user.json) is a session credential. It is listed in
 * .gitignore and must never be committed or printed.
 */
const AUTH_STATE_FILE = path.join(__dirname, '..', '.auth', 'user.json');

test('authenticate and save storage state', async ({ page }) => {
  const user = getValidUser();
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(user.username, user.password);

  // Same proof of a successful login the UI test uses.
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(loginPage.username).toHaveText(user.displayName);

  fs.mkdirSync(path.dirname(AUTH_STATE_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_STATE_FILE });
});