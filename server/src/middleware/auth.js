const prisma = require('../config/prisma');
const cache = require('../utils/cache');
const ApiError = require('../utils/apiError');
const { verify } = require('../utils/sessionToken');

async function auth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new ApiError(401, 'Unauthorized', 'UNAUTHORIZED'));

  try {
    const payload = verify(token);
    if (!payload) return next(new ApiError(401, 'Invalid or expired session', 'INVALID_SESSION'));

    const cacheKey = `auth:user:${payload.sub}`;
    let sessionUser = await cache.get(cacheKey);
    if (!sessionUser) {
      const user = await prisma.users.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, role: true, is_active: true } });
      if (!user || !user.is_active) return next(new ApiError(401, 'User not found', 'USER_NOT_FOUND'));
      sessionUser = { sub: user.id, email: user.email, role: user.role };
      await cache.set(cacheKey, sessionUser, 'EX', 300);
    }

    req.user = sessionUser;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired session', 'INVALID_SESSION'));
  }
}

module.exports = auth;
