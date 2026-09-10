const { PrismaClient } = require("@prisma/client");

const isDev = process.env.NODE_ENV === "development";

// Global singleton — prevents creating multiple PrismaClient instances
// during nodemon hot-reloads in development, which exhausts connection pools.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    // dev: log slow/warn queries for debugging; prod: errors only (no query noise)
    log: isDev ? ["query", "warn", "error"] : ["error"],
  });

if (isDev) {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
