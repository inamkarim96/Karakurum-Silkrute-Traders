const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");

const GUEST_CART_TTL_SECONDS = 7 * 24 * 60 * 60;

function toNumber(value) {
  return Number(value || 0);
}

function buildGuestCartKey(sessionId) {
  return `cart:guest:${sessionId}`;
}

async function fetchVariantForCart(productId, variantId) {
  return prisma.product_variants.findFirst({
    where: {
      id: variantId,
      product_id: productId,
      products: { is_active: true }
    },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          images: true,
          is_active: true
        }
      }
    }
  }).then(v => v ? {
    ...v,
    variant_id: v.id,
    product_name: v.products.name,
    product_images: v.products.images,
    is_active: v.products.is_active
  } : null);
}

async function getCartByUserId(userId) {
  return cache.getOrSet(`cart:user:${userId}`, 10, async () => {
    const items = await prisma.cart_items.findMany({
      where: {
        user_id: userId,
        products: { is_active: true }
      },
      include: {
        products: { select: { id: true, name: true, images: true } },
        product_variants: { select: { id: true, label: true, price: true } }
      },
      orderBy: { created_at: "desc" }
    });

    let subtotal = 0;
    let itemCount = 0;

    const mappedItems = items.map((ci) => {
      const unitPrice = toNumber(ci.product_variants.price);
      const quantity = toNumber(ci.quantity);
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;
      itemCount += quantity;

      return {
        id: ci.id,
        product: {
          id: ci.products.id,
          name: ci.products.name,
          image: ci.products.images?.[0] || null
        },
        variant: {
          id: ci.product_variants.id,
          label: ci.product_variants.label,
          price: unitPrice
        },
        quantity,
        item_total: itemTotal
      };
    });

    return {
      items: mappedItems,
      subtotal,
      item_count: itemCount
    };
  });
}

async function addItem(userId, payload) {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.product_variants.findUnique({
      where: { id: payload.variant_id },
      include: { products: { select: { is_active: true, name: true } } }
    });
    
    if (!variant || !variant.products.is_active) {
      throw new ApiError(404, "Product/variant not found or inactive", "INVALID_CART_ITEM");
    }

    const existing = await tx.cart_items.findUnique({
      where: {
        user_id_variant_id: {
          user_id: userId,
          variant_id: payload.variant_id
        }
      }
    });

    const newQuantity = (existing?.quantity || 0) + payload.quantity;
    if (toNumber(variant.stock) < newQuantity) {
      throw new ApiError(422, "Insufficient stock", "INSUFFICIENT_STOCK");
    }

    if (existing) {
      await tx.cart_items.update({
        where: { id: existing.id },
        data: {
          quantity: newQuantity,
          updated_at: new Date()
        }
      });
    } else {
      await tx.cart_items.create({
        data: {
          user_id: userId,
          product_id: payload.product_id,
          variant_id: payload.variant_id,
          quantity: payload.quantity
        }
      });
    }

    if (cache) await cache.del(`cart:user:${userId}`);
    return getCartByUserId(userId);
  });
}

async function updateItemQuantity(userId, itemId, quantity) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.cart_items.findFirst({
      where: { id: itemId, user_id: userId },
      include: { 
        products: { select: { is_active: true } },
        product_variants: { select: { stock: true } }
      }
    });

    if (!item || !item.products.is_active) {
      throw new ApiError(404, "Cart item not found", "CART_ITEM_NOT_FOUND");
    }

    if (quantity === 0) {
      await tx.cart_items.delete({ where: { id: itemId } });
      if (cache) await cache.del(`cart:user:${userId}`);
      return getCartByUserId(userId);
    }

    if (toNumber(item.product_variants.stock) < quantity) {
      throw new ApiError(422, "Insufficient stock", "INSUFFICIENT_STOCK");
    }

    await tx.cart_items.update({
      where: { id: itemId },
      data: {
        quantity,
        updated_at: new Date()
      }
    });

    if (cache) await cache.del(`cart:user:${userId}`);
    return getCartByUserId(userId);
  });
}

async function removeItem(userId, itemId) {
  await prisma.cart_items.deleteMany({
    where: { id: itemId, user_id: userId }
  });
  if (cache) await cache.del(`cart:user:${userId}`);
  return getCartByUserId(userId);
}

async function clearCart(userId) {
  await prisma.cart_items.deleteMany({
    where: { user_id: userId }
  });
  if (cache) await cache.del(`cart:user:${userId}`);
  return getCartByUserId(userId);
}

async function getGuestCart(sessionId) {
  if (!cache || !sessionId) return [];
  const raw = await cache.get(buildGuestCartKey(sessionId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function mergeGuestCart(userId, sessionId) {
  if (!sessionId) return getCartByUserId(userId);
  
  const guestItems = await getGuestCart(sessionId);
  if (!guestItems.length) return getCartByUserId(userId);

  return prisma.$transaction(async (tx) => {
    for (const item of guestItems) {
      const variant = await tx.product_variants.findUnique({
        where: { id: item.variant_id },
        include: { products: { select: { is_active: true } } }
      });

      if (!variant || !variant.products.is_active) continue;

      const existing = await tx.cart_items.findUnique({
        where: {
          user_id_variant_id: {
            user_id: userId,
            variant_id: item.variant_id
          }
        }
      });

      const finalQuantity = toNumber(existing?.quantity || 0) + toNumber(item.quantity);
      if (toNumber(variant.stock) < finalQuantity) continue;

      if (existing) {
        await tx.cart_items.update({
          where: { id: existing.id },
          data: { quantity: finalQuantity, updated_at: new Date() }
        });
      } else {
        await tx.cart_items.create({
          data: {
            user_id: userId,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity
          }
        });
      }
    }
    if (cache) await cache.del(`cart:user:${userId}`);
    return getCartByUserId(userId);
  });
}

async function setGuestCart(sessionId, items) {
  if (!cache || !sessionId) return;
  await cache.set(
    buildGuestCartKey(sessionId),
    JSON.stringify(Array.isArray(items) ? items : []),
    "EX",
    GUEST_CART_TTL_SECONDS
  );
}

module.exports = {
  getCartByUserId,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeGuestCart,
  getGuestCart,
  setGuestCart
};
