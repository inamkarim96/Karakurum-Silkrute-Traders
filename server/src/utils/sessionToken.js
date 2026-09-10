const jwt = require('jsonwebtoken');
const { SESSION_SECRET } = require('../config/env');

const secret = SESSION_SECRET || 'development-session-secret-change-me';

function verify(token) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function createSession(user) {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  }, secret, { expiresIn: '7d' });
}

module.exports = { createSession, verify };
