const { sendSuccess } = require("../../utils/apiResponse");
const asyncHandler = require("../../utils/asyncHandler");
const analyticsService = require("./analytics.service");

const getOverview = asyncHandler(async (req, res) => {
  const result = await analyticsService.getOverview();
  sendSuccess(res, result);
});

const getRevenue = asyncHandler(async (req, res) => {
  const { period, date_from, date_to } = req.query;
  const result = await analyticsService.getRevenueAnalytics(period, date_from, date_to);
  sendSuccess(res, result);
});

const getTopProducts = asyncHandler(async (req, res) => {
  const result = await analyticsService.getTopProducts();
  sendSuccess(res, result);
});

const getInventory = asyncHandler(async (req, res) => {
  const result = await analyticsService.getInventoryAnalytics();
  sendSuccess(res, result);
});

module.exports = {
  getOverview,
  getRevenue,
  getTopProducts,
  getInventory,
};
