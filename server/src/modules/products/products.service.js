const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const slugify = require("../../utils/slugify");
const cache = require("../../utils/cache");

// Helper to update search_vector via raw SQL
async function updateSearchVector(tx, productId) {
  await tx.$executeRaw`
    UPDATE products
    SET search_vector =
      setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(description, '')), 'B')
    WHERE id = ${productId}
  `;
}

async function ensureUniqueSlug(name, excludeId = null) {
  const baseSlug = slugify(name);
  let slug = baseSlug;

  for (let i = 0; i < 15; i += 1) {
    const existing = await prisma.products.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {})
      },
      select: { id: true }
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  throw new ApiError(500, "Unable to generate product slug", "SLUG_GENERATION_FAILED");
}


async function fetchReviewStatsByProductIds(productIds) {
  if (!productIds.length) return {};

  const stats = await prisma.reviews.groupBy({
    by: ["product_id"],
    where: { product_id: { in: productIds } },
    _avg: { rating: true },
    _count: { id: true }
  });

  return stats.reduce((acc, row) => {
    acc[row.product_id] = {
      avg_rating: row._avg.rating ? Number(row._avg.rating.toFixed(1)) : 0,
      review_count: Number(row._count.id || 0)
    };
    return acc;
  }, {});
}

function mapProduct(row, reviewMap) {
  const review = reviewMap[row.id] || { avg_rating: 0, review_count: 0 };
  return {
    ...row,
    category: row.categories,
    product_variants: row.product_variants || [],
    avg_rating: review.avg_rating,
    review_count: review.review_count
  };
}


async function getAllProductsFromDB() {
  const cacheKey = "products:all";
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Fetch products and stats concurrently without BEGIN/COMMIT overhead
  const [rows, stats] = await Promise.all([

    prisma.products.findMany({
      select: {
        id: true, category_id: true, name: true, slug: true,
        description: true, base_price: true, wholesale_price: true, min_wholesale_qty: true, stock: true, images: true,
        is_featured: true, is_active: true, created_at: true, updated_at: true,
        categories: { select: { id: true, name: true, slug: true } },
        product_variants: { orderBy: { sort_order: "asc" } }
      }
    }),
    prisma.reviews.groupBy({
      by: ["product_id"],
      _avg: { rating: true },
      _count: { id: true }
    })
  ]);

  const reviewMap = stats.reduce((acc, row) => {
    acc[row.product_id] = {
      avg_rating: row._avg.rating ? Number(row._avg.rating.toFixed(1)) : 0,
      review_count: Number(row._count.id || 0)
    };
    return acc;
  }, {});

  const products = rows.map(row => mapProduct(row, reviewMap));

  await cache.set(cacheKey, products, "EX", 3600);
  return products;
}

async function listProducts(filters) {
  const cacheKey = `products:list:${JSON.stringify(filters)}`;
  const cachedData = await cache.get(cacheKey);
  if (cachedData) return cachedData;

  const allProducts = await getAllProductsFromDB();
  
  // In-memory filtering
  let filtered = allProducts.filter(p => p.is_active === true);

  if (filters.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q)
    );
  }
  if (filters.category) {
    filtered = filtered.filter(p => p.category?.slug === filters.category);
  }
  if (filters.min_price !== undefined) {
    filtered = filtered.filter(p => Number(p.base_price) >= Number(filters.min_price));
  }
  if (filters.max_price !== undefined) {
    filtered = filtered.filter(p => Number(p.base_price) <= Number(filters.max_price));
  }
  if (filters.featuredOnly) {
    filtered = filtered.filter(p => p.is_featured === true);
  }
  if (filters.in_stock) {
    filtered = filtered.filter(p => Number(p.stock) > 0);
  }
  if (filters.variant_label || filters.attribute_value) {
    filtered = filtered.filter(p => {
      if (!p.product_variants || p.product_variants.length === 0) return false;
      return p.product_variants.some(v => {
        let match = true;
        if (filters.variant_label && !v.label?.toLowerCase().includes(filters.variant_label.toLowerCase())) match = false;
        if (filters.attribute_value && !v.attribute_value?.toLowerCase().includes(filters.attribute_value.toLowerCase())) match = false;
        return match;
      });
    });
  }

  // In-memory sorting
  if (filters.sort === "price_asc") {
    filtered.sort((a, b) => Number(a.base_price) - Number(b.base_price));
  } else if (filters.sort === "price_desc") {
    filtered.sort((a, b) => Number(b.base_price) - Number(a.base_price));
  } else if (filters.sort === "name_asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters.sort === "popular") {
    filtered.sort((a, b) => Number(b.review_count || 0) - Number(a.review_count || 0));
  } else {
    // Default: created_at desc (newest)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // In-memory pagination
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginatedProducts = filtered.slice(skip, skip + limit);

  const result = {
    products: paginatedProducts,
    pagination: { page, limit, total, pages: total === 0 ? 0 : Math.ceil(total / limit) }
  };

  await cache.set(cacheKey, result, "EX", filters.featuredOnly ? 120 : 60);
  return result;
}

async function listAdminProducts(filters) {
  const cacheKey = `products:admin:list:${JSON.stringify(filters)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const allProducts = await getAllProductsFromDB();
  
  // Admin list sees everything, so we only apply sorting and pagination
  let filtered = [...allProducts];

  // In-memory sorting (default newest)
  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // In-memory pagination
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginatedProducts = filtered.slice(skip, skip + limit);

  const result = {
    products: paginatedProducts,
    pagination: { page, limit, total, pages: total === 0 ? 0 : Math.ceil(total / limit) }
  };
  await cache.set(cacheKey, result, "EX", 300);
  return result;
}

async function getFeaturedProducts() {
  return listProducts({ page: 1, limit: 20, sort: "newest", featuredOnly: true }).then(
    (result) => result.products
  );
}

async function searchProducts({ q, page, limit }) {
  const pageNum = Number(page || 1);
  const limitNum = Number(limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const cacheKey = `products:search:${q}:${pageNum}:${limitNum}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [matches, totalRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, ts_rank(search_vector, websearch_to_tsquery('simple', ${q})) AS rank
      FROM products
      WHERE is_active = true
        AND search_vector @@ websearch_to_tsquery('simple', ${q})
      ORDER BY rank DESC, created_at DESC
      OFFSET ${skip} LIMIT ${limitNum}
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM products
      WHERE is_active = true
        AND search_vector @@ websearch_to_tsquery('simple', ${q})
    `
  ]);

  const ids = matches.map((match) => match.id);
  const rows = ids.length === 0 ? [] : await prisma.products.findMany({
    where: { id: { in: ids } },
    include: {
      categories: true,
      product_variants: { orderBy: { sort_order: 'asc' } }
    }
  });
  const rowMap = new Map(rows.map((row) => [row.id, row]));
  const reviewMap = await fetchReviewStatsByProductIds(ids);
  const paginatedProducts = ids.map((id) => mapProduct(rowMap.get(id), reviewMap));
  const total = totalRows[0]?.total || 0;

  const result = {
    products: paginatedProducts,
    pagination: { page: pageNum, limit: limitNum, total, pages: total === 0 ? 0 : Math.ceil(total / limitNum) }
  };

  await cache.set(cacheKey, result, "EX", 30);
  return result;
}

async function _getProductByIdWithClient(client, id, includeInactive = false) {
  const row = await client.products.findUnique({
    where: {
      id,
      ...(includeInactive ? {} : { is_active: true })
    },
    include: {
      categories: true,
      product_variants: {
        orderBy: { sort_order: "asc" }
      }
    }
  });

  if (!row) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  const reviewMap = await fetchReviewStatsByProductIds([row.id]);
  return mapProduct(row, reviewMap);
}

async function getProductById(id, includeInactive = false) {
  const cacheKey = `product:id:${id}:${includeInactive}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Go directly to DB — do NOT load all products just to find one (O(N) antipattern)
  const result = await _getProductByIdWithClient(prisma, id, includeInactive);
  await cache.set(cacheKey, result, "EX", 300);
  return result;
}

async function getProductBySlug(slug) {
  const cacheKey = `product:slug:${slug}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Direct slug query with full includes — avoids loading all products for a single lookup
  const row = await prisma.products.findUnique({
    where: { slug, is_active: true },
    include: {
      categories: true,
      product_variants: { orderBy: { sort_order: "asc" } }
    }
  });
  if (!row) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");

  const reviewMap = await fetchReviewStatsByProductIds([row.id]);
  const result = mapProduct(row, reviewMap);
  await cache.set(cacheKey, result, "EX", 300);
  return result;
}

async function createProduct(payload) {
  return prisma.$transaction(async (tx) => {
    // Validate category only if provided
    if (payload.category_id) {
      const category = await tx.categories.findUnique({
        where: { id: payload.category_id }
      });
      if (!category) {
        throw new ApiError(400, "Invalid category", "INVALID_CATEGORY");
      }
    }

    const slug = await ensureUniqueSlug(payload.name);
    const totalVariantStock = payload.product_variants?.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0) || 0;

    const product = await tx.products.create({
      data: {
        category_id: payload.category_id || null,
        name: payload.name,
        slug,
        description: payload.description || null,
        base_price: payload.base_price,
        wholesale_price: payload.wholesale_price ?? null,
        min_wholesale_qty: payload.min_wholesale_qty ?? null,
        stock: payload.product_variants?.length > 0 ? totalVariantStock : (payload.stock ?? 0),
        images: payload.images || [],
        is_featured: payload.is_featured ?? false,
        is_active: payload.is_active ?? true,
        product_variants: {
          create: payload.product_variants?.map((v, idx) => ({
            label: v.label,
            attribute_name: v.attribute_name || null,
            attribute_value: v.attribute_value || null,
            price: v.price,
            wholesale_price: v.wholesale_price ?? null,
            stock: v.stock ?? 0,
            sort_order: v.sort_order ?? idx
          })) || []
        }
      }
    });

    // Update search_vector for full-text search
    await updateSearchVector(tx, product.id);

    await cache.del("products:all");
    await cache.clearPattern("products:list");
    await cache.clearPattern("products:search");
    return _getProductByIdWithClient(tx, product.id, true);
  });
}

async function updateProduct(id, payload) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.products.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    const data = {
      updated_at: new Date()
    };

    if (payload.category_id !== undefined) {
      if (payload.category_id) {
        const category = await tx.categories.findUnique({ where: { id: payload.category_id } });
        if (!category) {
          throw new ApiError(400, "Invalid category", "INVALID_CATEGORY");
        }
        data.category_id = payload.category_id;
      } else {
        // Allow clearing category
        data.category_id = null;
      }
    }
    if (payload.name && payload.name !== existing.name) {
      data.name = payload.name;
      data.slug = await ensureUniqueSlug(payload.name, id);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "description")) {
      data.description = payload.description;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "base_price")) {
      data.base_price = payload.base_price;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "wholesale_price")) {
      data.wholesale_price = payload.wholesale_price;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "min_wholesale_qty")) {
      data.min_wholesale_qty = payload.min_wholesale_qty;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "stock")) {
      data.stock = payload.stock;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "images")) {
      data.images = payload.images;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "is_featured")) {
      data.is_featured = payload.is_featured;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "is_active")) {
      data.is_active = payload.is_active;
    }

    if (payload.product_variants && payload.product_variants.length > 0) {
      data.stock = payload.product_variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

      const incomingIds = payload.product_variants.map(v => v.id).filter(Boolean);

      // 1. Delete variants that were removed in UI
      await tx.product_variants.deleteMany({
        where: { product_id: id, id: { notIn: incomingIds } }
      }).catch(err => {
        console.warn(`Could not delete some variants for product ${id}:`, err.message);
      });

      // 2. Create and update all variants concurrently — O(1) round-trips instead of O(n)
      await Promise.all(
        payload.product_variants.map((v, idx) => {
          const variantData = {
            label: v.label,
            attribute_name: v.attribute_name || null,
            attribute_value: v.attribute_value || null,
            price: v.price,
            wholesale_price: v.wholesale_price ?? null,
            stock: v.stock ?? 0,
            sort_order: v.sort_order ?? idx
          };
          if (v.id) {
            return tx.product_variants.update({ where: { id: v.id }, data: variantData });
          }
          return tx.product_variants.create({ data: { ...variantData, product_id: id } });
        })
      );
    }

    await tx.products.update({
      where: { id },
      data
    });

    // Update search_vector if name or description changed
    if (payload.name || Object.prototype.hasOwnProperty.call(payload, "description")) {
      await updateSearchVector(tx, id);
    }

    await Promise.all([
      cache.clearPattern("products:list"),
      cache.clearPattern("products:admin:list"),
      cache.clearPattern(`product:id:${id}`),
      cache.del(`product:slug:${existing.slug}`)
    ]);
    return _getProductByIdWithClient(tx, id, true);
  });
}

async function updateStock(id, stock) {
  try {
    await prisma.products.update({
      where: { id },
      data: { stock, updated_at: new Date() }
    });
    return getProductById(id, true);
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }
    throw err;
  }
}

async function deleteProduct(id) {
  try {
    const existing = await prisma.products.findUnique({ where: { id } });
    await prisma.products.delete({
      where: { id }
    });
    await Promise.all([
      cache.del("products:all"),
      cache.clearPattern("products:list"),
      cache.clearPattern("products:admin:list"),
      cache.clearPattern("products:search"),
      cache.clearPattern(`product:id:${id}`),
      existing ? cache.del(`product:slug:${existing.slug}`) : Promise.resolve()
    ]);
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }
    if (err.code === "P2003") {
      throw new ApiError(400, "Cannot permanently delete product because it is linked to existing orders. You should deactivate it instead.", "DELETE_RESTRICTED");
    }
    throw err;
  }
}

async function appendProductImage(id, imageUrl) {
  const product = await prisma.products.findUnique({ where: { id } });
  if (!product) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  const images = Array.isArray(product.images) ? product.images : [];
  return prisma.products.update({
    where: { id },
    data: {
      images: [...images, imageUrl],
      updated_at: new Date()
    }
  });
}

module.exports = {
  getAllProductsFromDB,
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
  appendProductImage
};
