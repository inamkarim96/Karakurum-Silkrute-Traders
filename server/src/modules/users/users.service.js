const bcrypt = require("bcrypt");
const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");

async function getProfile(userId) {
  return cache.getOrSet(`user:profile:${userId}`, 300, async () => {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        email_verified: true,
        is_active: true,
        created_at: true,
        addresses: {
          orderBy: [
            { is_default: "desc" },
            { created_at: "desc" }
          ]
        }
      }
    });

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    // Admin Role Sync Fallback
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    if (user.email.toLowerCase().trim() === adminEmail && user.role !== "admin") {
      await prisma.users.update({
        where: { id: user.id },
        data: { role: "admin" }
      });
      user.role = "admin";
    }

    return user;
  });
}

async function updateProfile(userId, payload) {
  if (Object.keys(payload).length === 0) {
    return getProfile(userId);
  }

  // Only allow safe fields to be updated
  const allowedFields = {};
  if (payload.name !== undefined) allowedFields.name = payload.name;
  if (payload.phone !== undefined) allowedFields.phone = payload.phone;

  if (Object.keys(allowedFields).length > 0) {
    await prisma.users.update({
      where: { id: userId },
      data: {
        ...allowedFields,
        updated_at: new Date()
      }
    });
    await Promise.all([
      cache.del(`user:profile:${userId}`),
      cache.clearPattern("users:admin:list:")
    ]);
  }
  return getProfile(userId);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { password_hash: true }
  });
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw new ApiError(400, "Incorrect current password", "INVALID_PASSWORD");
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  await prisma.users.update({
    where: { id: userId },
    data: {
      password_hash,
      updated_at: new Date()
    }
  });

  if (cache) {
    await Promise.all([
      cache.del(`refresh:${userId}`),
      cache.del(`user:profile:${userId}`)
    ]);
  }
}

async function getAddresses(userId) {
  return cache.getOrSet(`user:addresses:${userId}`, 300, () =>
    prisma.addresses.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_default: "desc" },
        { created_at: "desc" }
      ]
    })
  );
}

async function addAddress(userId, payload) {
  const result = await prisma.$transaction(async (tx) => {
    if (payload.is_default) {
      await tx.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      });
    }

    return tx.addresses.create({
      data: {
        user_id: userId,
        ...payload
      }
    });
  });

  await Promise.all([
    cache.del(`user:addresses:${userId}`),
    cache.del(`user:profile:${userId}`)
  ]);
  return result;
}

async function updateAddress(userId, addressId, payload) {
  const result = await prisma.$transaction(async (tx) => {
    const address = await tx.addresses.findFirst({
      where: { id: addressId, user_id: userId }
    });
    if (!address) {
      throw new ApiError(403, "Address not found or unauthorized", "FORBIDDEN");
    }

    if (payload.is_default) {
      await tx.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      });
    }

    return tx.addresses.update({
      where: { id: addressId },
      data: { 
        ...payload, 
        updated_at: new Date() 
      }
    });
  });

  await Promise.all([
    cache.del(`user:addresses:${userId}`),
    cache.del(`user:profile:${userId}`)
  ]);
  return result;
}

async function deleteAddress(userId, addressId) {
  const address = await prisma.addresses.findFirst({
    where: { id: addressId, user_id: userId }
  });
  if (!address) {
    throw new ApiError(403, "Address not found or unauthorized", "FORBIDDEN");
  }

  try {
    await prisma.addresses.delete({
      where: { id: addressId }
    });
    await Promise.all([
      cache.del(`user:addresses:${userId}`),
      cache.del(`user:profile:${userId}`)
    ]);
  } catch (err) {
    // Prisma Foreign Key violation error code for Postgres
    if (err.code === "P2003") {
      throw new ApiError(422, "Cannot delete address because it is referenced by an order", "ADDRESS_REFERENCED");
    }
    throw err;
  }
}

async function listUsers(query) {
  const { page, limit, role } = query;
  const skip = (page - 1) * limit;

  const cacheKey = `users:admin:list:${JSON.stringify(query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const where = {};
  if (role) {
    where.role = role;
  }

  const [total, users] = await prisma.$transaction([
    prisma.users.count({ where }),
    prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        email_verified: true,
        is_active: true,
        created_at: true
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip
    })
  ]);

  const result = {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };

  await cache.set(cacheKey, result, "EX", 30);
  return result;
}

async function getUserDetails(userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      email_verified: true,
      is_active: true,
      created_at: true,
      _count: {
        select: { orders: true }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  // Map _count.orders to order_count for compatibility
  const result = { ...user, order_count: user._count.orders };
  delete result._count;

  return result;
}

async function updateUserStatus(userId, isActive) {
  try {
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        is_active: isActive,
        updated_at: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        is_active: true,
        role: true
      }
    });

    await Promise.all([
      cache.del(`user:profile:${userId}`),
      cache.clearPattern("users:admin:list:")
    ]);

    return user;
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    throw err;
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listUsers,
  getUserDetails,
  updateUserStatus
};
