const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");

async function updateProductRatingCache(productId) {
  if (!cache) return;

  const stats = await prisma.reviews.aggregate({
    where: { product_id: productId },
    _avg: { rating: true },
    _count: { id: true }
  });

  const avgRating = parseFloat(stats._avg.rating || 0).toFixed(1);
  const totalCount = stats._count.id;

  await cache.set(`product:rating:${productId}`, JSON.stringify({ avg_rating: avgRating, total_count: totalCount }), "EX", 3600);
}

async function getProductReviews(productId, { page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;

  return cache.getOrSet(`reviews:${productId}:${page}:${limit}`, 60, async () => {
    const [reviews, stats] = await prisma.$transaction([
      prisma.reviews.findMany({
        where: { product_id: productId },
        include: {
          users: { select: { name: true } }
        },
        orderBy: { created_at: "desc" },
        take: parseInt(limit),
        skip
      }),
      prisma.reviews.aggregate({
        where: { product_id: productId },
        _avg: { rating: true },
        _count: { id: true }
      })
    ]);

    return {
      reviews: reviews.map(r => ({
        ...r,
        user_name: r.users?.name
      })),
      avg_rating: parseFloat(stats._avg.rating || 0).toFixed(1),
      total_count: stats._count.id,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  });
}

async function createReview(userId, { product_id, rating, title, body }) {
  // Run purchase verification and duplicate check concurrently — 2 serial queries → 1 parallel batch
  const [purchase, existing] = await Promise.all([
    prisma.orders.findFirst({
      where: {
        user_id: userId,
        status: "delivered",
        order_items: { some: { product_id } }
      },
      select: { id: true }
    }),
    prisma.reviews.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id } },
      select: { id: true }
    })
  ]);

  if (!purchase) {
    throw new ApiError(403, "You can only review products you have purchased and received.", "PURCHASE_REQUIRED");
  }

  if (existing) {
    throw new ApiError(409, "You have already reviewed this product.", "DUPLICATE_REVIEW");
  }

  const review = await prisma.reviews.create({
    data: {
      user_id: userId,
      product_id,
      rating,
      title,
      body,
      created_at: new Date()
    }
  });

  // Recalculate rating cache and invalidate review list cache in parallel
  await Promise.all([
    updateProductRatingCache(product_id),
    cache.clearPattern(`reviews:${product_id}:`)
  ]);

  return review;
}

async function deleteReview(userId, reviewId) {
  const review = await prisma.reviews.findUnique({
    where: { id: reviewId }
  });
  if (!review) {
    throw new ApiError(404, "Review not found", "NOT_FOUND");
  }

  if (review.user_id !== userId) {
    throw new ApiError(403, "Not authorized to delete this review", "FORBIDDEN");
  }

  await prisma.reviews.delete({ where: { id: reviewId } });
  await updateProductRatingCache(review.product_id);
}

async function adminDeleteReview(reviewId) {
  const review = await prisma.reviews.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new ApiError(404, "Review not found", "NOT_FOUND");
  }

  await prisma.reviews.delete({ where: { id: reviewId } });
  await updateProductRatingCache(review.product_id);
}

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
  adminDeleteReview,
};
