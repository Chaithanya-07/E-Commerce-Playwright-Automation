// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * QADemo Playwright framework configuration.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',

  /* Run test files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if test.only was left in the source */
  forbidOnly: !!process.env.CI,

  /*
   * The suite runs against a live site. Under a full parallel cross-browser
   * run (every browser project hitting qademo.com at once) a page
   * occasionally loads slowly enough to flake one test; retrying once
   * locally absorbs that without hiding anything - Playwright still marks
   * the test as "flaky" in the report, and the first retry is traced.
   */
  retries: process.env.CI ? 2 : 1,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /*
   * Three complementary reporters:
   * - html:  the Playwright-native report, written to playwright-report/
   * - list:  live pass/fail output in the terminal
   * - allure-playwright: writes one JSON result file per test execution to
   *   allure-results/, which the Allure CLI turns into a presentation report
   */
  reporter: [['html', { open: 'never' }], ['list'], ['allure-playwright']],

  /*
   * The full checkout journey visits several pages and performs a payment step,
   * so the 30s default is tight on a slow connection.
   */
  timeout: 60 * 1000,

  /*
   * Web-first assertions retry until they pass or this window closes. The 5s
   * default is tight for WebKit and Firefox when the whole suite runs in
   * parallel against the live site: a product page's data fetch can take
   * longer than 5s under load, and the assertion gives up while the page is
   * still legitimately loading. 10s keeps assertions meaningful while giving
   * slower browsers room.
   */
  expect: { timeout: 10 * 1000 },

  use: {
    /* Every page object calls page.goto('/path') relative to this */
    baseURL: 'https://qademo.com',

    /* Evidence for failures */
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',

    /*
     * Record a video of every test, but keep the file only when the test
     * failed. Passing tests discard their video, so artifact storage stays
     * small while every failure still has visual execution evidence.
     */
    video: 'retain-on-failure',
  },

  /*
   * Projects: one setup project plus one project per supported browser.
   * Each browser project depends on 'setup', which logs in once (Chromium)
   * and saves the storage state. Playwright runs the dependency only once
   * no matter how many projects need it, so there is exactly one UI login.
   *
   * The 'api' project runs the pure API specs (tests/api/*.api.spec.js).
   * They use Playwright's request context and no browser, so they must run
   * exactly once - the browser projects therefore ignore them, and this
   * project's testMatch keeps the hybrid spec (which does need a browser)
   * out. It has no 'setup' dependency because the API tests log in through
   * the API themselves (see fixtures/api.fixture.js).
   */
  projects: [
    {
      name: 'setup',
      testDir: './auth',
      testMatch: /auth\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.js/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /.*\.api\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      testIgnore: /.*\.api\.spec\.js/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      dependencies: ['setup'],
      testIgnore: /.*\.api\.spec\.js/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
