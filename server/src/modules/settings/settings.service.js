const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");

const CACHE_KEY = "settings:site";

// Fallback used only if the admin hasn't saved settings yet (first run).
// Everything here is meant to be overwritten from the admin panel -
// nothing downstream should assume these values stay hardcoded.
const DEFAULT_SETTINGS = {
  company_name: "Karakurum Silkrute Traders",
  tagline: "Wholesale & Retail Trading - Blankets & Home Items",
  logo_url: null,
  address_line: "Fida Jan Plaza, Baig Market",
  city: "Danyore",
  email: null,
  phone: null,
  whatsapp: null,
  facebook_url: null,
  instagram_url: null,
  map_embed_url: null,
  footer_text: null,
  notification_email: null,
  // Page images — controlled from admin Site Settings
  hero_image_url: null,
  about_hero_image_url: null,
  about_mission_image_url: null,
  contact_hero_image_url: null
};

/**
 * site_settings is a singleton table (always exactly one row). This makes
 * sure that row exists and returns it. Everything the storefront needs to
 * display (name, address, contact info) comes from here instead of being
 * hardcoded in components.
 */
async function getSettings() {
  const cached = await cache.get(CACHE_KEY);
  if (cached) return cached;

  let settings = await prisma.site_settings.findFirst();

  if (!settings) {
    settings = await prisma.site_settings.create({ data: DEFAULT_SETTINGS });
  }

  await cache.set(CACHE_KEY, settings, "EX", 3600);
  return settings;
}

async function updateSettings(payload) {
  const existing = await prisma.site_settings.findFirst();

  const settings = existing
    ? await prisma.site_settings.update({
      where: { id: existing.id },
      data: payload
    })
    : await prisma.site_settings.create({
      data: { ...DEFAULT_SETTINGS, ...payload }
    });

  await cache.del(CACHE_KEY);
  return settings;
}

module.exports = {
  getSettings,
  updateSettings
};
