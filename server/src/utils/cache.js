const NodeCache = require("node-cache");

const cacheStore = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const cache = {
  async get(key) {
    return cacheStore.get(key) || null;
  },
  async set(key, value, ex, ttl) {
    if (ex === "EX" && ttl) {
      cacheStore.set(key, value, ttl);
    } else {
      cacheStore.set(key, value);
    }
    return "OK";
  },
  async del(key) {
    const deleted = cacheStore.del(key);
    return deleted > 0 ? 1 : 0;
  },
  async clearPattern(pattern) {
    let count = 0;
    const keys = cacheStore.keys();
    for (const key of keys) {
      if (key.startsWith(pattern)) {
        cacheStore.del(key);
        count++;
      }
    }
    return count;
  },

  /**
   * Cache-aside helper: returns cached value or calls fetchFn, caches result.
   * Eliminates boilerplate get/set pattern in services.
   * @param {string} key - Cache key
   * @param {number} ttl - TTL in seconds
   * @param {Function} fetchFn - Async function to fetch data on cache miss
   */
  async getOrSet(key, ttl, fetchFn) {
    const cached = cacheStore.get(key);
    if (cached !== undefined) return cached;
    const result = await fetchFn();
    cacheStore.set(key, result, ttl);
    return result;
  },

  /**
   * Delete multiple keys at once (batch invalidation).
   * @param {string[]} keys - Array of cache keys to delete
   */
  async delMulti(keys) {
    return cacheStore.del(keys);
  },

  on: () => {},
  once: () => {},
  status: "ready"
};

module.exports = cache;
