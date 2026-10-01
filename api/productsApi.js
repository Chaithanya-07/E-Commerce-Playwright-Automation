/**
 * productsApi - read-only API calls for /api/products.
 *
 * Verified against the live API:
 * - GET /api/products        -> 200, data is an array of product objects
 * - GET /api/products/id/:id -> 200, data is one product; unknown id -> 404
 *
 * Product fields seen in responses: id, name, slug, description, price,
 * stock, imageKey, imageUrl, isActive, createdAt, updatedAt.
 *
 * These endpoints are public - no authentication headers needed.
 */

/** Returns the whole catalogue. */
async function getAllProducts(request) {
  return request.get('/api/products');
}

/** Returns one product looked up by its numeric id. */
async function getProductById(request, productId) {
  return request.get(`/api/products/id/${productId}`);
}

module.exports = { getAllProducts, getProductById };