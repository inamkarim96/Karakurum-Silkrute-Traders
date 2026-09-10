const express = require("express");
const controller = require("./reviews.controller");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const router = express.Router();

router.get("/product/:productId", controller.getProductReviews);
router.post("/", auth, controller.createReview);
router.delete("/:id", auth, controller.deleteReview);
router.delete("/admin/:id", auth, role("admin"), controller.adminDeleteReview);

module.exports = router;
