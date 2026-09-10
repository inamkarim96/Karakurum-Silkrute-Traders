const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const slugify = require("../../utils/slugify");
const cache = require("../../utils/cache");

const PREDEFINED_CATEGORIES = [
  {
    name: 'Blankets',
    slug: 'blankets',
    image: 'https://images.unsplash.com/photo-1580301762395-21ce6e0dcf2d?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Home Textiles',
    slug: 'home-textiles',
    image: 'https://images.unsplash.com/photo-1616486338812-3d954c812d8a?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Decorative Items',
    slug: 'decorative-items',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Trading Goods',
    slug: 'trading-goods',
    image: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=600',
  }
];

async function buildUniqueCategorySlug(name, excludeId = null) {
  const base = slugify(name);
  let slug = base;

  for (let i = 0; i < 10; i += 1) {
    const existing = await prisma.categories.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {})
      },
      select: { id: true }
    });
    
    if (!existing) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  throw new ApiError(500, "Unable to generate unique slug", "SLUG_GENERATION_FAILED");
}

async function listCategories() {
  const cacheKey = "categories:list";
  const cachedData = await cache.get(cacheKey);
  if (cachedData) return cachedData;

  const categories = await prisma.categories.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { created_at: "desc" }
  });

  const result = categories.map((cat) => ({
    ...cat,
    product_count: cat._count.products
  }));

  await cache.set(cacheKey, result, "EX", 300);
  return result;
}

async function getCategoryById(id) {
  return cache.getOrSet(`category:id:${id}`, 60, async () => {
    const category = await prisma.categories.findUnique({
      where: { id }
    });
    if (!category) {
      throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
    }
    return category;
  });
}

async function createCategory(payload) {
  const slug = await buildUniqueCategorySlug(payload.name);
  const result = await prisma.categories.create({
    data: {
      name: payload.name,
      slug,
      image: payload.image || null
    }
  });
  await cache.del("categories:list");
  return result;
}

async function updateCategory(id, payload) {
  const existing = await prisma.categories.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }

  const data = { updated_at: new Date() };

  if (payload.name && payload.name !== existing.name) {
    data.name = payload.name;
    data.slug = await buildUniqueCategorySlug(payload.name, id);
  }
  if (payload.image !== undefined) {
    data.image = payload.image || null;
  }

  const result = await prisma.categories.update({
    where: { id },
    data
  });
  await cache.del("categories:list");
  return result;
}

async function deleteCategory(id) {
  const category = await prisma.categories.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } }
    }
  });

  if (!category) {
    throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }

  if (category._count.products > 0) {
    throw new ApiError(
      400,
      "Cannot delete category with linked products",
      "CATEGORY_HAS_PRODUCTS"
    );
  }

  await prisma.categories.delete({ where: { id } });
  await cache.del("categories:list");
}

async function initializeDefaults() {
  const existingCount = await prisma.categories.count();
  if (existingCount > 0) {
    return { message: "Categories already exist", count: 0 };
  }

  await prisma.categories.createMany({
    data: PREDEFINED_CATEGORIES
  });
  return { message: "Default categories initialized", count: PREDEFINED_CATEGORIES.length };
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  initializeDefaults,
  PREDEFINED_CATEGORIES
};
