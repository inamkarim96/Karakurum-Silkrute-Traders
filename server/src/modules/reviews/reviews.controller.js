const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const reviewsService = require("./reviews.service");

const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page, limit } = req.query;
  const result = await reviewsService.getProductReviews(productId, { page, limit });
  sendSuccess(res, result);
});

const createReview = asyncHandler(async (req, res) => {
  const { product_id, rating, title, body } = req.body;
  const review = await reviewsService.createReview(req.user.sub, { product_id, rating, title, body });
  sendSuccess(res, review, 201);
});

const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await reviewsService.deleteReview(req.user.sub, id);
  sendSuccess(res, { message: "Review deleted successfully" });
});

const adminDeleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await reviewsService.adminDeleteReview(id);
  sendSuccess(res, { message: "Review deleted by admin" });
});

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
  adminDeleteReview,
};
