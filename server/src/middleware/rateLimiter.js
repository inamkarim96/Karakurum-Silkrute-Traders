const rateLimit = require("express-rate-limit");
const { NODE_ENV } = require("../config/env");

// In development / test, skip all rate limiting so local dev isn't interrupted.
const isDev = NODE_ENV === "development" || NODE_ENV === "test";

/**
 * Global rate limiter — applied to all /api routes.
 * Allows 200 requests per 15 minutes per IP.
 */
const globalLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,
      standardHeaders: true,     // Return RateLimit-* headers
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." }
      }
    });

/**
 * Auth-specific rate limiter — applied to /auth routes.
 * Stricter: 10 requests per 15 minutes per IP.
 * Protects against brute-force login attacks.
 */
const authLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "AUTH_RATE_LIMITED", message: "Too many auth attempts, please try again in 15 minutes." }
      }
    });

/**
 * Forgot-password rate limiter — applied ONLY to /auth/forgot-password
 * and /auth/reset-password.
 * Very strict: 5 requests per hour per IP.
 * Protects against OTP spam, SendGrid credit abuse, and account enumeration.
 */
const forgotPasswordLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: "OTP_RATE_LIMITED",
          message: "Too many password reset attempts. Please wait 1 hour before trying again."
        }
      }
    });

module.exports = { globalLimiter, authLimiter, forgotPasswordLimiter };

