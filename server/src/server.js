const app = require("./app");

const { PORT, ADMIN_EMAIL } = require("./config/env");
const prisma = require("./config/prisma");
const productsService = require("./modules/products/products.service");
const categoriesService = require("./modules/categories/categories.service");
const analyticsService = require("./modules/admin/analytics.service");
const ordersService = require("./modules/orders/orders.service");

// ─── Keep-alive ping: prevents Neon serverless from sleeping ───
// Neon suspends idle connections after ~5 minutes. Ping every 3 minutes
// so the connection stays warm and the next real query doesn't hit a cold start.
const KEEP_ALIVE_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
let keepAliveTimer = null;

function startKeepAlive() {
  keepAliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      console.warn("Keep-alive ping failed (non-fatal):", err.message);
    }
  }, KEEP_ALIVE_INTERVAL_MS);

  // Don't let the timer prevent Node from exiting
  if (keepAliveTimer.unref) {
    keepAliveTimer.unref();
  }
}

async function warmCache() {
  try {
    console.log("Warming cache...");

    // 1. Warm DB connection with a raw query — confirms the wire is open
    await prisma.$queryRaw`SELECT 1`;

    // 2. Pre-fetch admin user
    if (ADMIN_EMAIL) {
      await prisma.users.findUnique({
        where: { email: ADMIN_EMAIL },
        select: { id: true, role: true }
      }).catch(() => { });
    }

    // 3. Warm application caches
    await Promise.all([
      categoriesService.listCategories(),
      productsService.getAllProductsFromDB()
    ]);

    console.log("Cache warmed successfully.");
  } catch (err) {
    console.warn("Cache warm-up failed (non-fatal):", err.message);
  }
}

async function startServer() {
  const maxAttempts = 5;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      await prisma.$connect();
      console.log("Connected to PostgreSQL via Prisma");
      break; // success
    } catch (err) {
      attempt++;
      console.warn(`Prisma connection attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxAttempts) {
        console.error('Unable to connect to PostgreSQL after multiple attempts. Exiting.');
        process.exit(1);
      }
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * 2 ** attempt, 10000);
      await new Promise(res => setTimeout(res, delay));
    }
  }

  const http = require("http");
  const server = http.createServer(app);
  const socketUtil = require("./utils/socket");
  socketUtil.init(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start keep-alive pings to prevent Neon from sleeping
    startKeepAlive();
    // Pre-warm cache in the background after server is ready
    warmCache();
  });
}

// Graceful shutdown — clear the keep-alive timer
process.on("SIGTERM", () => {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", () => {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  prisma.$disconnect();
  process.exit(0);
});

startServer();
