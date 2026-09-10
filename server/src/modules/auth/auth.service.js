const bcrypt = require('bcrypt');
const prisma = require('../../config/prisma');
const cache = require('../../utils/cache');
const ApiError = require('../../utils/apiError');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('../../config/env');
const { createSession } = require('../../utils/sessionToken');

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
  const { password_hash: _password, ...safe } = user;
  return safe;
}

async function findUser(email) {
  return prisma.users.findUnique({ where: { email }, select: { ...USER_SELECT, password_hash: true } });
}

async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  let user = await findUser(normalizedEmail);

  if (!user && normalizedEmail === ADMIN_EMAIL.toLowerCase().trim()) {
    user = await prisma.users.create({
      data: {
        email: normalizedEmail,
        name: 'Admin',
        role: 'admin',
        password_hash: await bcrypt.hash(ADMIN_PASSWORD, 10),
        is_active: true,
        email_verified: true
      },
      select: { ...USER_SELECT, password_hash: true }
    });
  }

  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const safeUser = publicUser(user);
  await cache.set(`user:profile:${user.id}`, safeUser, 'EX', 300);
  return { user: safeUser, token: createSession(user) };
}

async function register(payload) {
  const email = payload.email.toLowerCase().trim();
  if (await prisma.users.findUnique({ where: { email }, select: { id: true } })) {
    throw new ApiError(409, 'Email is already registered', 'EMAIL_EXISTS');
  }

  const user = await prisma.users.create({
    data: {
      email,
      name: payload.name.trim(),
      phone: payload.phone || null,
      password_hash: await bcrypt.hash(payload.password, 12),
      is_active: true,
      email_verified: true,
      addresses: payload.address || payload.city ? { create: { full_name: payload.name.trim(), phone: payload.phone || null, address_line: payload.address || null, city: payload.city || null, country: payload.country || 'PK', is_default: true } } : undefined
    },
    select: { ...USER_SELECT, password_hash: true }
  });

  const safeUser = publicUser(user);
  return { user: safeUser, token: createSession(user) };
}

module.exports = { login, register };
