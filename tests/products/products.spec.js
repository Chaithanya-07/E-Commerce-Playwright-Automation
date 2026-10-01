const { test, expect } = require('@playwright/test');
const { ProductsPage } = require('../../pages/ProductsPage');
const { HomePage } = require('../../pages/HomePage');
const { getProducts } = require('../../utils/testData');

const products = getProducts();
const speaker = products.inStock.bluetoothSpeaker;
const batmanTshirt = products.outOfStock.batmanTshirt;

test.describe('Products', () => {
  test('the catalog lists products with their prices', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    await expect(productsPage.heading).toHaveText('Product Catalog');
    await expect(productsPage.productCountText).toHaveText(
      /Browse our complete selection of \d+ products/
    );
    await expect(productsPage.productCard(speaker.name)).toBeVisible();
    await expect(productsPage.productPrice(speaker.name)).toHaveText(speaker.price);
  });

  test('an in-stock product can be added to the cart', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const homePage = new HomePage(page);

    await productsPage.goto();
    await productsPage.addToCart(speaker.name);

    // The navbar badge is the app's own confirmation that the item was added.
    await homePage.expectCartCount(1);
  });

  test('an out-of-stock product cannot be added to the cart', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    await expect(productsPage.outOfStockBadge(batmanTshirt.name)).toBeVisible();
    await expect(productsPage.addToCartButton(batmanTshirt.name)).toBeDisabled();
  });
});
