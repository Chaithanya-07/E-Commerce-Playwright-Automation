const { test, expect } = require('@playwright/test');
const { ProductsPage } = require('../../pages/ProductsPage');
const { ProductDetailsPage } = require('../../pages/ProductDetailsPage');
const { HomePage } = require('../../pages/HomePage');
const { getProducts } = require('../../utils/testData');

const products = getProducts();
const speaker = products.inStock.bluetoothSpeaker;

test.describe('Product details', () => {
  test('the details page shows the product name and price', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);

    await productDetailsPage.goto(speaker.slug);

    await expect(productDetailsPage.name).toHaveText(speaker.name);
    await expect(productDetailsPage.price).toHaveText(speaker.price);
    await expect(productDetailsPage.description).not.toBeEmpty();
  });

  test('a product can be opened from the catalog and matches its listing', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const productDetailsPage = new ProductDetailsPage(page);

    await productsPage.goto();
    const listedPrice = await productsPage.productPrice(speaker.name).innerText();

    await productsPage.openProduct(speaker.name);

    await expect(page).toHaveURL(new RegExp(`/products/${speaker.slug}$`));
    await expect(productDetailsPage.name).toHaveText(speaker.name);
    await expect(productDetailsPage.price).toHaveText(listedPrice);
  });

  test('a product can be added to the cart from its details page', async ({ page }) => {
    const productDetailsPage = new ProductDetailsPage(page);
    const homePage = new HomePage(page);

    await productDetailsPage.goto(speaker.slug);
    await productDetailsPage.addToCart();

    await homePage.expectCartCount(1);
  });
});
