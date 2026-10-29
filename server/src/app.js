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
  "http://localhost:4000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const norm = origin.replace(/\/+$/, "").toLowerCase();
      if (allowedOrigins.some(o => o && o.toLowerCase() === norm)) {
        return callback(null, true);
      }
      try {
        const u = new URL(origin);
        if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
          return callback(null, true);
        }
        if (u.hostname.endsWith(".vercel.app")) {
          return callback(null, true);
        }
      } catch (_) { }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Cache-Control",
        "Pragma",
        "Expires",
        "X-CSRF-Token"
      ],
        optionsSuccessStatus: 204,
          maxAge: 86400
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

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

  // Handle favicon and crawler requests cleanly without 404 logs
  app.get("/favicon.ico", (req, res) => res.status(204).end());
  app.get("/favicon.png", (req, res) => res.status(204).end());
  app.get("/robots.txt", (req, res) => res.type("text/plain").send("User-agent: *\nAllow: /\nDisallow: /api/"));

  // In serverless environments (e.g. Vercel), Socket.io is not running as a persistent WebSocket server.
  // Return 200 to prevent noisy 404 polling errors in browser consoles.
  app.all("/socket.io*", (req, res) => {
    res.status(200).json({ status: "serverless_active", transport: "sse_recommended" });
  });

  // Ensure MongoDB Atlas is connected before executing any API route.
  // /api/health manages its own connection check so it can report DB status.
  const { connectDB } = require("./config/db");
  app.use("/api", async (req, res, next) => {
    if (req.path === "/health") {
      return next();
    }

    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
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
