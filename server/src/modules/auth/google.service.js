const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");
const { createSession } = require("../../utils/sessionToken");

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  is_active: true,
  email_verified: true,
  created_at: true,
  addresses: {
    where: { is_default: true },
    select: { id: true, full_name: true, phone: true, address_line: true, city: true, province: true, postal_code: true, country: true, is_default: true }
  }
};

function publicUser(user) {
  const { password_hash: _password, google_id: _googleId, ...safe } = user;
  return safe;
}

async function findOrCreateUser({ googleId, email, name, picture, emailVerified }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Try to find by Google ID first
  let user = await prisma.users.findUnique({
    where: { google_id: googleId },
    select: { ...USER_SELECT, password_hash: true }
  });

  if (!user) {
    // Try to find by email
    user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { ...USER_SELECT, password_hash: true }
    });

    if (user) {
      // Link Google account to existing user
      if (!user.google_id) {
        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            google_id: googleId,
            auth_provider: "google",
            email_verified: emailVerified || user.email_verified
          },
          select: { ...USER_SELECT, password_hash: true }
        });
      }
    } else {
      // Create new user
      user = await prisma.users.create({
        data: {
          email: normalizedEmail,
          name: name || email.split("@")[0],
          google_id: googleId,
          auth_provider: "google",
          email_verified: emailVerified || true,
          is_active: true,
          role: "customer"
        },
        select: { ...USER_SELECT, password_hash: true }
      });
    }
  }

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated", "ACCOUNT_DEACTIVATED");
  }

  const safeUser = publicUser(user);
  await cache.set(`user:profile:${user.id}`, safeUser, "EX", 300);

  return { user: safeUser, token: createSession(user) };
}

async function linkGoogleAccount(userId, googleId, email) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if Google ID is already linked to another account
  const existingGoogle = await prisma.users.findUnique({
    where: { google_id: googleId },
    select: { id: true }
  });

  if (existingGoogle && existingGoogle.id !== userId) {
    throw new ApiError(409, "This Google account is already linked to another user", "GOOGLE_LINKED");
  }

  const user = await prisma.users.update({
    where: { id: userId },
    data: {
      google_id: googleId,
      auth_provider: "google"
    },
    select: USER_SELECT
  });

  await cache.del(`user:profile:${userId}`);
  return publicUser(user);
}

module.exports = {
  findOrCreateUser,
  linkGoogleAccount
};