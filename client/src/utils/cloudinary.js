

const CLOUDINARY_BASE = 'https://res.cloudinary.com';

/**
 * Injects Cloudinary transformation parameters into an existing Cloudinary URL.
 * Falls back gracefully to the original URL (or placeholder) for non-Cloudinary URLs.
 *
 * @param {string|null|undefined} url - Original image URL
 * @param {object} options
 * @param {number} [options.width=800] - Target display width in pixels
 * @param {number} [options.height] - Optional height constraint
 * @param {string} [options.crop='fill'] - Cloudinary crop mode
 * @param {string} [options.quality='auto'] - Quality setting (auto, auto:best, etc.)
 * @param {string} [options.format='auto'] - Format (auto serves WebP/AVIF)
 * @param {string} [options.gravity='auto'] - Smart gravity for cropping
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  const PLACEHOLDER = 'https://res.cloudinary.com/dcwpuw2ca/image/upload/f_auto,q_auto,w_600/KarakurumSilkruteTraders/placeholder';

  if (!url || typeof url !== 'string') return PLACEHOLDER;

  if (!url.includes(CLOUDINARY_BASE) && !url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width = 800,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'auto',
  } = options;

  const transforms = [
    `f_${format}`,
    `q_${quality}`,
    `w_${width}`,
    height ? `h_${height}` : null,
    `c_${crop}`,
    `g_${gravity}`,
    'dpr_auto',
  ].filter(Boolean).join(',');


  const uploadMarker = '/upload/';
  const uploadIndex = url.indexOf(uploadMarker);

  if (uploadIndex === -1) {
    return url;
  }

  const before = url.slice(0, uploadIndex + uploadMarker.length);
  const after = url.slice(uploadIndex + uploadMarker.length);


  const cleanAfter = after.replace(/^(?:[a-z]+_[^/]+,?)+\//, '');

  return `${before}${transforms}/${cleanAfter}`;
}


export function getBlurPlaceholder(url) {
  return getOptimizedImageUrl(url, { width: 20, quality: 30, format: 'auto' });
}

export function getResponsiveSrcSet(url, widths = [300, 600, 900, 1200]) {
  if (!url) return '';
  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}
