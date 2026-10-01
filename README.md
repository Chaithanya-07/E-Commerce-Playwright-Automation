# QADemo Playwright Automation Framework

A JavaScript Page Object Model (POM) test framework for the **QADemo E-Commerce**
application (`https://qademo.com`), covering the core customer journey from
sign up through to order confirmation.

## Objective

Automate the customer-facing e-commerce workflow end to end using Playwright Test
and the Page Object Model, so that:

- tests describe **business behaviour**, not CSS selectors
- selectors live in **one place per page**, so a UI change is fixed once
- reusable data (credentials, products) is **separated from test logic**
- the suite runs reliably with Playwright's auto-waiting instead of hard sleeps

## Tech stack

| Tool | Version | Purpose |
| --- | --- | --- |
| JavaScript | ES2022 (CommonJS) | Language - **not** TypeScript |
| Node.js | 20+ | Runtime |
| @playwright/test | ^1.63.0 | Test runner, assertions, browser automation |
| Chromium, Firefox, WebKit | via Playwright | Browsers under test |
| allure-playwright | ^3.12.2 | Allure reporter - writes result JSON per test execution |
| Allure CLI (`allure`) | ^3.18.0 | Generates and serves the Allure report (no Java needed) |

## Framework structure

```text
E-Commerce-Playwright-Automation/
│
├── tests/                        # Test specs, grouped by feature area
│   ├── auth/
│   │   ├── signup.spec.js
│   │   └── login.spec.js
│   ├── products/
│   │   ├── products.spec.js
│   │   └── product-details.spec.js
│   ├── cart/
│   │   └── cart.spec.js
│   ├── checkout/
│   │   └── checkout.spec.js
│   └── api/
│       ├── products.api.spec.js  # pure API tests (run once, no browser)
│       ├── auth.api.spec.js
│       ├── cart.api.spec.js
│       ├── orders.api.spec.js
│       └── orders-hybrid.spec.js # API setup -> UI verification (3 browsers)
│
├── api/                          # Reusable API layer - one file per area
│   ├── authApi.js                # POST /api/auth/login
│   ├── productsApi.js            # GET /api/products...
│   ├── cartApi.js                # /api/cart... (X-Session-ID header)
│   └── ordersApi.js               # /api/orders... (Bearer token)
│
├── auth/
│   └── auth.setup.js             # logs in once, saves storageState to .auth/
│
├── fixtures/
│   ├── auth.fixture.js           # custom fixture: an already-authenticated page
│   └── api.fixture.js            # API fixtures: apiAuth token + isolated cartSession
│
├── pages/                        # Page objects - all selectors live here
│   ├── BasePage.js               # shared navbar (on every page)
│   ├── HomePage.js
│   ├── SignupPage.js
│   ├── LoginPage.js
│   ├── ProductsPage.js
│   ├── ProductDetailsPage.js
│   ├── CartPage.js
│   ├── CheckoutPage.js
│   └── OrdersPage.js             # /orders (My Orders history)
│
├── test-data/                    # Data, kept out of the tests
│   ├── products.json             # catalogue products + checkout details
│   ├── users.json                # real credentials (gitignored)
│   └── users.example.json        # template to copy from
│
├── utils/
│   └── testData.js               # loads data + generates unique signup users
│
├── playwright.config.js
├── package.json
├── .gitignore
└── README.md
```

Generated artifact directories (all gitignored - none of these are committed):

```text
test-results/      per-test artifacts: screenshots, traces, videos
playwright-report/ the Playwright HTML report
allure-results/    raw Allure result JSON written during the run
allure-report/     the generated, human-readable Allure report
```

### How the layers fit together

```text
tests   →  describe business behaviour; contain the assertions
  ↓
fixtures →  give a test what it needs to start (an already-signed-in page,
            an API token, an isolated cart session)
  ↓
pages   →  know the selectors and the actions for one screen
api     →  know the endpoints, headers and payloads for one API area
  ↓
test-data → holds the inputs (credentials, products), no logic
  ↓
utils   →  reads test-data and generates values like unique signup emails
```

- **tests** should read like a manual test script. If a test contains a raw
  selector, that selector belongs in a page object instead. Likewise, if a
  test contains a raw endpoint URL, that call belongs in the `api/` layer.
- **fixtures** sit between the test and the page objects. The auth fixture
  (see [Authentication architecture](#authentication-architecture)) provides
  authenticated pages without any test knowing how login works; the API
  fixtures (see [API automation](#api-automation)) do the same for API tokens
  and isolated cart sessions.
- **pages** answer "what can I do on this screen?". Each page object extends
  `BasePage` because every QADemo page renders the same navbar.
- **api** answers "what can I do with this backend area?" - one small file per
  endpoint group, so a URL or schema change is fixed in one place.
- **test-data** keeps values that change (a product's price, an account) out of
  the test code.
- **utils** is the single entry point tests use to get that data.

## Setup

### Prerequisites

- Node.js 20 or newer
- Network access to `https://qademo.com`

### Installation

```bash
npm install
npx playwright install chromium
```

### Credentials

The positive login test needs a real QADemo account.

1. Create an account at `https://qademo.com/signup`, or reuse an existing one.
2. Copy the template and fill it in:

```bash
cp test-data/users.example.json test-data/users.json
```

```json
{
  "validUser": {
    "username": "your email or username",
    "displayName": "the name shown in the navbar after login",
    "password": "your password"
  }
}
```

`test-data/users.json` is listed in `.gitignore` and must never be committed.
Commit `users.example.json` instead.

## Execution commands

```bash
npx playwright test                     # run everything, all three browsers
npx playwright test --project=chromium   # one browser (also: firefox, webkit)
npx playwright test --project=api        # pure API tests only (run once, no browser)
npx playwright test --headed             # watch the browser
npx playwright test tests/auth           # one folder, all browsers
npx playwright test tests/cart/cart.spec.js --project=firefox   # one file, one browser
npx playwright test tests/api/orders-hybrid.spec.js   # the API -> UI hybrid test
npx playwright test -g "add to cart"     # by test title
npx playwright show-report                # open the last HTML report
npx playwright test --ui                 # interactive UI mode
npx allure generate ./allure-results     # build the Allure report
npx allure open ./allure-report          # serve it and open it in a browser
```

The same commands are available as npm scripts - `npm test`, `npm run test:headed`,
`npm run test:api`, `npm run test:ui`, `npm run report`, `npm run allure:generate`,
`npm run allure:open` - which is shorter to type and what a CI pipeline calls.

## Cross-browser and parallel execution

The suite runs on **Chromium, Firefox and WebKit** through three Playwright
projects, plus the auth setup project and an API project:

```text
setup  ── login once, save storageState to .auth/user.json
  │
  ├── chromium   ─┐
  ├── firefox     ├─ each project runs every spec in its own browser
  └── webkit     ─┘   and depends on the single setup project

api    ── runs the pure API specs once; no browser, no setup dependency
         (they authenticate through the API themselves)
```

- **Projects** are defined in `playwright.config.js`. All three browser
  projects declare `dependencies: ['setup']`, so there is exactly **one UI
  login per run** - the same saved `storageState` is reused by every browser
  (verified working on all three). The browser projects `testIgnore` the
  pure API specs so those run exactly once, in the `api` project; the hybrid
  spec keeps running in all three browsers because it drives real UI.
- **Parallel execution** uses Playwright's built-in workers
  (`fullyParallel: true`, workers left at Playwright's default - it picks
  based on CPU count; this machine used 4). Tests are distributed across
  workers automatically; there is no custom parallelization. A full run is
  72 test executions (19 UI specs x 3 browsers + setup + 11 API tests +
  3 hybrid executions).
- **Test isolation**: every test gets a fresh browser context (own cookies,
  own `localStorage`, own cart), sign-up accounts use timestamped emails,
  API tests each get their own throwaway cart session (see
  [API automation](#api-automation)), and no test reads state written by
  another test - so any test can run in any order, in any browser, on any
  worker.

## Test coverage

19 UI tests plus one auth setup test (each UI test on all three browsers),
11 pure API tests, and 1 API -> UI hybrid test (on all three browsers) -
72 executions per full run, all passing.

### Sign up - `tests/auth/signup.spec.js`
- a new user can register and lands logged in
- registration is rejected when the passwords do not match
- registration is rejected when the email is already registered

### Login - `tests/auth/login.spec.js`
- a valid user can log in
- login is rejected when the password is wrong
- login is rejected for a user that does not exist
- required field validation is shown when the form is submitted empty

### Products - `tests/products/products.spec.js`
- the catalog lists products with their prices
- an in-stock product can be added to the cart
- an out-of-stock product cannot be added to the cart

### Product details - `tests/products/product-details.spec.js`
- the details page shows the product name and price
- a product can be opened from the catalog and matches its listing
- a product can be added to the cart from its details page

### Cart - `tests/cart/cart.spec.js`
- an empty cart shows the empty state
- an added product appears in the cart with its price
- increasing the quantity updates the item subtotal and the order total
- decreasing the quantity brings the subtotal back down
- removing the last item returns the cart to its empty state

### Checkout - `tests/checkout/checkout.spec.js`
- a logged-in customer can place an order and see the confirmation

### Products API - `tests/api/products.api.spec.js` (runs once, no browser)
- the catalogue endpoint returns a list of products with the expected fields
- a product can be fetched by its numeric id
- an unknown product id returns 404 with a NOT_FOUND error code

### Auth API - `tests/api/auth.api.spec.js`
- login with valid credentials returns an access token and the user
- login with a wrong password returns 401 INVALID_CREDENTIALS
- a standard user token is rejected by admin endpoints (401 "Invalid token")

### Cart API - `tests/api/cart.api.spec.js`
- an item added through the API appears in the session cart
- clearing the cart empties the session
- adding an item without a quantity returns 400 with validation details

### Orders API - `tests/api/orders.api.spec.js`
- the order history endpoint lists the account orders with expected fields
  (and seeds one order itself through the API if the account has none, so it
  never depends on an earlier run)
- the order history cannot be read without a token (401)

### API -> UI hybrid - `tests/api/orders-hybrid.spec.js` (all three browsers)
- an order created through the API appears in the UI order history

## API automation

Phase 5 adds real API usage to the UI framework using **Playwright's built-in
`request` capability** - no axios, no supertest, no separate API framework.
Every endpoint, header and payload below was **verified against the live
`qademo.com` API before any test was written**; nothing was taken from the
application's documentation on faith.

### Why API testing is included

For some scenarios, creating all test data through the UI makes tests slower
and more dependent on UI setup. The API layer prepares the required backend
state instead, then the UI verifies that the customer-facing application
really reflects that state - faster setup, and it also proves the integration
between the API and the UI.

### The API utility layer (`api/`)

Raw endpoints never appear inside test files. Each area has one small file,
and every function takes Playwright's `request` context so the configured
`baseURL` applies:

| File | Wraps | Auth it applies |
| --- | --- | --- |
| `api/authApi.js` | `POST /api/auth/login` | none (it *produces* the token) |
| `api/productsApi.js` | `GET /api/products`, `GET /api/products/id/:id` | none |
| `api/cartApi.js` | `GET/POST/DELETE /api/cart(/items)` | `X-Session-ID` header |
| `api/ordersApi.js` | `GET /api/orders(/:id)`, `POST /api/orders` | `Authorization: Bearer <token>` |

Tests express intent (`await cartApi.addCartItem(request, sessionId, 4, 2)`),
so an endpoint change is fixed in one file, not in every test.

### Verified authentication (two independent mechanisms)

The live API uses **two different authentication schemes**, both verified
empirically:

1. **Token auth** - `POST /api/auth/login` with `{ username, password }`
   returns `{ accessToken, user }`. The orders endpoints require it as an
   `Authorization: Bearer <token>` header; without it they answer
   `401 UNAUTHORIZED`. The token lives only in test memory - never logged,
   saved or committed.
2. **Session auth** - the cart endpoints ignore the token entirely and key
   the shopper by the `X-Session-ID` header (a request with only a Bearer
   header is rejected with `400 "Missing X-Session-ID header"`). In the UI
   the browser generates this id and stores it in `localStorage`.

### API fixtures (`fixtures/api.fixture.js`)

Two fixtures, both lazy (unused = free), layered on top of the existing
`authenticatedPage` fixture:

- **`apiAuth`** - logs in through the API once per test and provides
  `{ accessToken, user }`.
- **`cartSession`** - generates a fresh random session id so every test gets
  an **isolated server-side cart**, and clears that cart again after the test
  as cleanup (safe even on an empty cart - `DELETE /api/cart` returns 200).

### Endpoints actually used (all verified live)

| Method | Endpoint | Status observed | Used for |
| --- | --- | --- | --- |
| GET | `/api/products` | 200 | catalogue shape assertions |
| GET | `/api/products/id/:id` | 200 / 404 | product lookup + negative |
| POST | `/api/auth/login` | 200 / 401 | token + negative |
| GET | `/api/cart` | 200 | read back what was written |
| POST | `/api/cart/items` | 200 / 400 | cart test data + negative |
| DELETE | `/api/cart` | 200 | cleanup |
| GET | `/api/orders` | 200 / 401 | history + negative |
| GET | `/api/orders/:id` | 200 | cross-check after UI |
| POST | `/api/orders` | 201 | hybrid flow order creation |
| GET | `/api/admin/stats` | 401 | negative: standard token rejected |

### The API -> UI hybrid flow

The flagship scenario (`tests/api/orders-hybrid.spec.js`) - API creates the
state, the UI proves the customer sees it, the API confirms both agree:

```text
API   login (token in memory)
  ↓
API   GET /api/products/id/4          name + price come from the server
  ↓
API   POST /api/cart/items (qty 2)     fresh, isolated session cart
  ↓
API   POST /api/orders  -> 201         dynamic order id, server-computed total
  ↓
UI    /orders (My Orders)              find the order by its dynamic id,
                                      verify number, total, customer name
  ↓
API   GET /api/orders/:id              same state from the backend again
```

Why the hybrid verifies through **order history** rather than the cart page:
QADemo's cart page renders from `localStorage`, not from the server, so an
API-prepared cart would never honestly appear there (this was verified - the
cart page issues no cart request at all). Orders are real server-side state
that the UI fetches via `GET /api/orders`, which makes the verification a
genuine end-to-end proof. The order id used in the UI assertions is the
dynamic id returned by the API - never hard-coded.

### Cleanup and isolation

- Each API test's cart lives under its own throwaway `X-Session-ID` - it
  cannot collide with another test, another browser, or a UI test's cart.
- The `cartSession` fixture clears the cart after every test.
- Placing an order **consumes the session cart** (verified: the cart is empty
  after `POST /api/orders`), so the hybrid flow cleans up after itself.
- Orders cannot be deleted - there is no delete endpoint (verified: `DELETE
  /api/orders/:id` answers 404). Like the UI checkout test, the hybrid test
  therefore leaves one real order per browser in the test account's history.
  This is the one piece of test data that accumulates; see
  [Known limitations](#known-limitations).

## Reporting

Every run produces several complementary forms of evidence:

| Evidence | When it is captured | Where it is stored |
| --- | --- | --- |
| HTML report | every run | `playwright-report/` |
| List output | every run (live in the terminal) | - |
| Allure results | every run, one JSON file per test execution | `allure-results/` |
| Allure report | generated on demand (command below) | `allure-report/` |
| Screenshot | failed tests (`only-on-failure`) | `test-results/<test>/` |
| Trace | first retry of a test (`on-first-retry`) | `test-results/<test>/` |
| Video | failed tests (`retain-on-failure`) | `test-results/<test>/` |

### Commands

```bash
npx playwright test                    # run the suite (writes the HTML report and Allure results)
npx playwright show-report             # open the Playwright HTML report in a browser
npx allure generate ./allure-results   # build the Allure report from the last run's results
npx allure open ./allure-report        # serve the Allure report and open it in a browser
```

All four commands are tested and work as written. `allure open` prints a local
URL such as `http://localhost:54089` and keeps serving until you stop it with
Ctrl+C.

### Playwright HTML report

The native execution report, written to `playwright-report/` on every run. It
shows per-test steps, error messages and all attachments (screenshots, traces,
videos), and is configured with `open: 'never'` so it does not steal focus while
a run is in progress.

### Allure report

A second, presentation-oriented report built from the same runs. The
`allure-playwright` reporter writes one JSON result file per test execution to
`allure-results/`; the Allure CLI then turns those into a static report in
`allure-report/` with a dashboard, categories, and per-test detail pages. The
Allure CLI used here is Allure Report 3, which is a Node.js package — unlike
the older Java-based Allure 2, no JVM installation is required.

Verified behaviour (full run after the API tests were added): 72 test
executions (19 UI specs x 3 browsers + setup + 11 API tests + 3 hybrid
executions) produced a report showing **72 total / 72 passed**.

### Screenshot

Captured automatically when a test fails (`screenshot: 'only-on-failure'`) —
a PNG of the page state at the moment of failure, attached to the test in both
the HTML and Allure reports.

### Trace

Captured on the **first retry** of a test (`trace: 'on-first-retry'`), so the
retry that finally failed (or flaked) has full debugging evidence: every action,
network request/response and DOM snapshot. Open one with:

```bash
npx playwright show-trace test-results\<test folder>\trace.zip
```

### Video

Recorded for every test but **retained only for failures**
(`video: 'retain-on-failure'`). Passing tests discard their video, which keeps
artifact storage small while every failure still has a recording of what
actually happened on screen.

One subtlety: the runner's video setting only reaches the contexts the runner
creates itself. The tests that start already authenticated (checkout and the
hybrid) use a context created inside the auth fixture, so that context records
its video itself — into the test's own artifact folder — and the fixture
deletes the file when the test passed, reproducing `retain-on-failure` by hand
(see `fixtures/auth.fixture.js`).

Verified behaviour, both directions:

- a deliberately failing temporary test retained `video.webm` for both its
  attempts (382 KB and 397 KB) alongside the failure screenshot, and the retry
  also produced `trace.zip` — the temp test was then deleted;
- a fully passing 58-execution run left **zero** video files in `test-results/`.

## Evidence strategy

What each form of evidence is *for*:

- **screenshot** → visual failure evidence: the page state at the moment the
  test failed
- **trace** → debugging evidence: actions, network traffic and DOM snapshots
  leading to the failure
- **video** → visual execution evidence for retained failures: what happened
  on screen over time
- **HTML report** → the Playwright-native execution report: steps, errors and
  all attachments in one place
- **Allure report** → consolidated, presentation-friendly reporting for
  sharing results (dashboard, categories, history-oriented presentation)

The interview answer this implements: *"Test fails → the screenshot shows the
state, the trace shows the actions and network traffic, the video shows the
execution, and the HTML/Allure reports organise all of it. I avoid retaining
videos for every successful test to keep artifact storage small."*

## Reporting configuration

The settings live in `playwright.config.js`:

```js
reporter: [['html', { open: 'never' }], ['list'], ['allure-playwright']],

use: {
  screenshot: 'only-on-failure',
  trace: 'on-first-retry',
  video: 'retain-on-failure',
},
```

- `reporter` lists three complementary reporters: the HTML report, terminal
  list output, and the Allure result writer. Adding a reporter does not remove
  any other.
- `screenshot: 'only-on-failure'` — a PNG only when a test fails.
- `trace: 'on-first-retry'` — a trace only for the retry of a flaky/failed
  test, so clean runs stay lightweight.
- `video: 'retain-on-failure'` — every test is recorded; the file is deleted
  when the test passes and kept when it fails.

All generated artifact directories (`test-results/`, `playwright-report/`,
`allure-results/`, `allure-report/`) are listed in `.gitignore` and are never
committed.

## Authentication architecture

Authenticated tests do not log in through the UI. Login happens **once** and
its result is reused:

```text
auth/auth.setup.js   (setup project, runs first)
    UI login with LoginPage + users.json
    ↓
    save cookies + localStorage  →  .auth/user.json  (gitignored)
    ↓
fixtures/auth.fixture.js  (test.extend)
    opens a context seeded with the saved state
    ↓
    authenticatedPage  →  the test starts already signed in
    ↓
checkout.spec.js    uses page objects exactly as before, no login steps
```

- `playwright.config.js` defines a **setup project** that runs before the main
  `chromium` project (`dependencies: ['setup']`), so the state file always
  exists before authenticated tests run.
- Tests that need a signed-in customer import `test` from
  `fixtures/auth.fixture.js` and destructure `authenticatedPage` — a page in its
  own isolated context, already authenticated. The fixture never contains
  login logic; it only reuses the state the setup saved.
- **Unauthenticated tests are untouched.** Signup, login (positive and
  negative) and all product/cart specs use the plain `test` from
  `@playwright/test`, so the negative login tests genuinely start without a
  session.
- `.auth/user.json` is a live session credential, like a password. It is in
  `.gitignore`, never printed, and its contents are never asserted on.

The interview answer this implements: *"How do you avoid logging in before
every test?"* — log in once in a setup project, save the storage state, and let
a fixture hand each authenticated test an already-signed-in page.

## Hooks

Hooks are used only where they remove real duplication, never for show:

- `tests/auth/login.spec.js` — `test.beforeEach` opens the login page, the
  shared first step of every login test.
- `tests/cart/cart.spec.js` — the four cart-manipulation tests share one
  arrangement (add the fitness tracker, open the cart); a `beforeEach` inside a
  nested describe performs it.

`beforeAll`/`afterAll` are deliberately **not** used: they share state across
tests in a file, which invites order dependence. Playwright already gives every
test a fresh browser context, which is the isolation `afterEach` cleanups would
otherwise try to recreate.

## Design notes

**Selectors.** QADemo ships `data-testid` attributes on its interactive elements,
so the framework uses `getByTestId()` as its primary strategy. Catalog and cart
rows carry a numeric product id (`product-card-4`, `cart-item-4`), but tests refer
to products by name; the page objects resolve the name to the right row. This is
why `ProductsPage.productCard()` filters the grid by an exact product name rather
than hard-coding ids.

**No hard waits.** The suite contains no `waitForTimeout` calls. Waiting is done
with web-first assertions and, where the app needs it, by waiting on the specific
API response.

**Adding to / changing the cart.** QADemo is a single-page app, and its cart
behaviour has two traps the framework handles in `BasePage.clickAndAwaitCartApi()`:

1. The navbar badge updates optimistically the instant "Add" is clicked, but the
   item is only persisted when `POST /api/cart/items` succeeds - and QADemo only
   writes the cart into `localStorage` a moment *after* that response, from the
   page's own JavaScript. Navigating inside either window loses the item. The
   helper therefore waits for the response **and** for the stored cart to change.
2. A click that lands before the page's JavaScript has finished booting is
   **silently ignored** - no request is sent at all. Firefox and WebKit resolve
   page load earlier than the app attaches its handlers, so under parallel load
   a first click can vanish (the button looks identical either way). The helper
   re-clicks - at most three bounded, response-driven attempts - and checks the
   visible cart state (badge count / quantity text / row presence) between
   attempts so an accepted click is never applied twice.

The cart page's own buttons (quantity, remove) go through the same helper,
waiting for their `PATCH`/`DELETE` calls.

## Known limitations

Features the brief anticipated that **QADemo does not support**, verified against
the live application rather than assumed:

- **Product search / filter** - the catalog has no search box, filter, or sort
  control. `ProductsPage` therefore has no `searchProduct()` method. Browsing and
  selecting a product is covered instead. (Re-checked for Phase 5 - unchanged.)
- **Locked user** - QADemo has no concept of a locked or blocked account. Only
  "wrong password" and "unknown user" negative cases exist, and both return the
  same `Invalid username or password` message. The API behaves the same way:
  wrong credentials answer `401 INVALID_CREDENTIALS` with no lockout.
- **Google sign-in** - the Sign In / Sign Up with Google buttons exist but are
  third-party OAuth and out of scope for UI automation.
- **`storageState` authentication** - implemented in Phase 2 (see
  [Authentication architecture](#authentication-architecture)); the setup
  project signs in once and authenticated tests reuse that state, on all three browsers.

API-related limitations, all verified against the live API during Phase 5:

- **Orders cannot be deleted** - `DELETE /api/orders/:id` has no route (404).
  API-created orders therefore accumulate in the test account's history, just
  like the orders the UI checkout test places. The account is a dedicated test
  account, so this is contained, but it is the one piece of test data that
  cannot be cleaned up.
- **The cart UI does not read the server cart** - the cart page hydrates from
  `localStorage` (`cart-storage`) and issues no cart API request at all, for
  guests or signed-in users. This is why the API -> UI hybrid verifies through
  order history (real server state) instead of the cart page - an
  API-prepared cart would only appear in the UI by injecting localStorage,
  which would test the injection, not the application.
- **Admin APIs are closed to standard users** - `GET /api/admin/stats` with a
  valid standard-user token answers `401 "Invalid token"` (the same status as
  no token at all, not 403). The negative test documents the actual observed
  behaviour; no admin-side test data creation is possible with a customer
  account, so none was attempted.

Other notes:

- Sign up creates **real accounts** on a live site. `generateSignupUser()` uses a
  timestamped email so every run is unique and re-runnable.
- The checkout test places a **real order** using the standard test card
  `4242 4242 4242 4242`; the API -> UI hybrid test places one order per
  browser through the API with the same test card. Orders accumulate in the
  account's order history (see the limitations above).
- **Chromium, Firefox and WebKit** are all enabled and passing (Phase 3). Mobile
  viewports remain out of scope for now.
- **Load flakiness on form submits** - the swallowed-click behaviour described
  under [Design notes](#design-notes) also applies, rarely, to the signup and
  login submit buttons. Cart and checkout flows are protected by the
  response-aware helper; the auth forms are not, because the negative
  validation there is client-side and produces no API call to wait on. A local
  retry (`retries: 1`) absorbs the occasional occurrence and Playwright still
  reports the test as flaky - nothing is hidden.
- Tests depend on the live `qademo.com` being reachable and on its product data.
  If catalogue prices change, update `test-data/products.json`.
