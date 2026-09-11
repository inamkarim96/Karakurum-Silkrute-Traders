const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const { globalLimiter, authLimiter } = require("./middleware/rateLimiter");

const { FRONTEND_URL } = require("./config/env");
const requestLogger = require("./middleware/requestLogger");
const responseTime = require("./middleware/responseTime");
const errorHandler = require("./middleware/errorHandler");
const apiV1Router = require("./routes");

const app = express();

app.use(responseTime);
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Remove any trailing slashes from FRONTEND_URL since Origin headers never have them
const cleanFrontendUrl = FRONTEND_URL.replace(/\/+$/, "");

const allowedOrigins = [
  cleanFrontendUrl, 
  cleanFrontendUrl.toLowerCase(),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const norm = origin.replace(/\/+$/, "").toLowerCase();
      if (allowedOrigins.some(o => o.toLowerCase() === norm)) {
        return callback(null, true);
      }
      try {
        const host = new URL(origin).hostname;
        if (host.endsWith(".vercel.app")) {
          return callback(null, true);
        }
      } catch (_) {}
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(cookieParser());
app.use("/auth", authLimiter);
app.use("/", globalLimiter);

app.use("/api/payments/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

// Root health & info check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Karakurum Silkrute Traders API is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", apiV1Router);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found"
    }
  });
});

app.use(errorHandler);

module.exports = app;
