/**
 * testData.js is the single place tests go to get their data.
 *
 * - getValidUser()      real credentials, read from users.json (not committed)
 * - getProducts()       product catalogue data from products.json
 * - generateSignupUser() a brand new account per call
 */
const fs = require('fs');
const path = require('path');

const TEST_DATA_DIR = path.join(__dirname, '..', 'test-data');

function readTestData(fileName) {
  const filePath = path.join(TEST_DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `test-data/${fileName} not found. Copy test-data/users.example.json to ` +
        `test-data/users.json and fill in a real QADemo account.`
    );
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Credentials for the account used by the positive login test. */
function getValidUser() {
  return readTestData('users.json').validUser;
}

/** Product catalogue data shared by the products, cart and checkout tests. */
function getProducts() {
  return readTestData('products.json');
}

/**
 * Signup creates a real account on QADemo, so re-using a fixed email would fail
 * with "an account with this email address already exists". A timestamp keeps
 * every run unique and lets the whole suite be re-run safely.
 */
function generateSignupUser() {
  const unique = Date.now();
  return {
    email: `qaauto.${unique}@example.com`,
    phone: '9000000000',
    username: `qaauto${unique}`,
    password: 'TestPass@123',
    confirmPassword: 'TestPass@123',
  };
}

module.exports = { getValidUser, getProducts, generateSignupUser };
