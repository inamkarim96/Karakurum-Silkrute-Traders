const { v4: uuidv4 } = require("uuid");
const productsService = require("./products.service");
const {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  listProductsSchema,
  searchProductsSchema,
  validate
} = require("./products.validation");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");
const { uploadProductImage } = require("../../config/cloudinary");

function assertValid(schema, payload) {
  const { error, value } = validate(schema, payload);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }
  return value;
}

async function listProducts(req, res) {
  const filters = assertValid(listProductsSchema, req.query);
  const data = await productsService.listProducts(filters);
  res.set("Cache-Control", "public, max-age=60");
  return sendSuccess(res, data);
}

async function listAdminProducts(req, res) {
  const data = await productsService.listAdminProducts(req.query);
  return sendSuccess(res, data);
}

async function getFeaturedProducts(req, res) {
  const products = await productsService.getFeaturedProducts();
  res.set("Cache-Control", "public, max-age=60");
  return sendSuccess(res, { products });
}

async function searchProducts(req, res) {
  const query = assertValid(searchProductsSchema, req.query);
  const data = await productsService.searchProducts(query);
  return sendSuccess(res, data);
}

async function getProductById(req, res) {
  const product = await productsService.getProductById(req.params.id);
  res.set("Cache-Control", "public, max-age=60");
  return sendSuccess(res, { product });
}

async function getProductBySlug(req, res) {
  const product = await productsService.getProductBySlug(req.params.slug);
  res.set("Cache-Control", "public, max-age=60");
  return sendSuccess(res, { product });
}

async function createProduct(req, res) {
  const payload = assertValid(createProductSchema, req.body);
  const product = await productsService.createProduct(payload);
  return sendSuccess(res, { product }, 201);
}

async function updateProduct(req, res) {
  const payload = assertValid(updateProductSchema, req.body);
  const product = await productsService.updateProduct(req.params.id, payload);
  return sendSuccess(res, { product });
}

async function updateStock(req, res) {
  const payload = assertValid(updateStockSchema, req.body);
  const product = await productsService.updateStock(req.params.id, payload.stock);
  return sendSuccess(res, { product });
}

async function deleteProduct(req, res) {
  await productsService.deleteProduct(req.params.id);
  return sendSuccess(res, { message: "Product deleted successfully" });
}

async function uploadProductImageById(req, res) {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Image file is required", "IMAGE_REQUIRED");
  }

  const filename = `product-${req.params.id}-${uuidv4().slice(0, 8)}`;
  const imageUrl = await uploadProductImage(req.file.buffer, filename);
  const product = await productsService.appendProductImage(req.params.id, imageUrl);

  return sendSuccess(res, { product, image_url: imageUrl });
}

module.exports = {
  listProducts,
  listAdminProducts,
  getFeaturedProducts,
  searchProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  uploadProductImageById
};
