const { test: base, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * auth.fixture is the layer between "test" and "page object" for tests that
 * need a signed-in customer.
 *
 *   test
 *    ↓
 *   fixture (this file)
 *    ↓
 *   storageState (saved once by auth/auth.setup.js)
 *    ↓
 *   authenticated browser context
 *    ↓
 *   page objects (used exactly as before)
 *
 * The fixture does not know how to log in - LoginPage in auth.setup.js does
 * that once. It only opens a context seeded with the saved state, so a test
 * receives a page that is already authenticated and can go straight to the
 * workflow under test.
 *
 * Unauthenticated tests keep using the plain `test` from @playwright/test and
 * are completely unaffected.
 */

// Written by auth/auth.setup.js; read from playwright.config.js so the base
// URL lives in exactly one place. The file itself is a session credential -
// it is gitignored and is never printed or committed.
const AUTH_STATE_FILE = path.join(__dirname, '..', '.auth', 'user.json');
const { use: baseOptions } = require('../playwright.config');

const authenticatedTest = base.extend({
  /**
   * A page that starts already signed in, in its own isolated context.
   *
   * Because the context is created fresh here, one authenticated test can
   * never leak its cart, cookies or session into another test.
   */
  authenticatedPage: async ({ browser }, use) => {
    const testInfo = base.info();
    const context = await browser.newContext({
      baseURL: baseOptions.baseURL,
      storageState: AUTH_STATE_FILE,

      /*
       * The runner's `video: 'retain-on-failure'` setting only applies to
       * contexts the runner creates itself - a context created here is
       * invisible to it. The fixture therefore records the video itself,
       * into this test's own output folder (testInfo.outputDir, i.e.
       * test-results/<test>-<project>/ - NOT testInfo.artifactDir, which
       * is a staging area the runner deletes after the run), and deletes
       * the file below when the test passed. That reproduces the config's
       * behaviour for the checkout and hybrid tests exactly: evidence for
       * failures, nothing retained for passes.
       */
      recordVideo: { dir: testInfo.outputDir },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();

    // video: 'retain-on-failure', applied by hand for this context: a
    // passing test discards its video, anything else keeps it. path()
    // resolves only once the context is closed and the file is written.
    if (testInfo.status === 'passed') {
      const video = page.video();
      if (video) {
        fs.promises.unlink(await video.path()).catch(() => {});
      }
    }
  },
});

module.exports = { test: authenticatedTest, expect };