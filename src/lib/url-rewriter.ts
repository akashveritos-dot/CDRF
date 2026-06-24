/**
 * Server-side URL rewriter for database records.
 * 
 * Rewrites raw /uploads/ paths to OPAQUE signed media tokens.
 * In DevTools inspect tab, users see:
 *   /api/media/aW1hZ2VfMTIzLmpwZw.1719270000.a7f2c9e1d3b5
 * instead of:
 *   /uploads/image_123.jpg
 * 
 * No filename, no extension — completely unrecognizable.
 * If copied and opened in a new tab → blocked by Sec-Fetch validation.
 * Tokens also expire after 2 hours.
 */

import { generateMediaUrl } from './media-token';

const URL_FIELDS = new Set([
  'image_url', 'imageUrl', 'download_url', 'downloadUrl',
  'video_url', 'videoUrl', 'main_image_url', 'mainImageUrl',
  'link_url', 'linkUrl', 'audioUrl', 'embedUrl'
]);

/**
 * Rewrites /uploads/filename to an opaque /api/media/<token> URL.
 * External URLs and non-upload paths pass through unchanged.
 * PDF download_urls are left as internal paths (served via /api/reports/serve/[id]).
 */
function rewriteUrl(value: string, fieldName: string): string {
  if (!value || typeof value !== 'string') return value;
  
  // External URLs pass through
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  
  // Only rewrite /uploads/ paths
  if (!value.startsWith('/uploads/')) return value;

  // PDF download URLs stay as internal paths — served via token-gated /api/reports/serve/[id]
  if (fieldName === 'download_url' || fieldName === 'downloadUrl') {
    return value; // Keep internal for server-side PDF serving
  }

  // Extract just the filename and generate an opaque signed URL
  const filename = value.replace('/uploads/', '');
  return generateMediaUrl(filename);
}

/**
 * Recursively rewrites all URL fields in a record, array, or deeply nested structure.
 * Handles: flat objects, arrays, nested objects, extra_data/extraData JSON strings.
 */
export function rewriteUploadUrls<T>(data: T): T {
  if (data === null || data === undefined) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => rewriteUploadUrls(item)) as T;
  }

  // Handle objects
  if (typeof data === 'object') {
    const result: any = { ...data };
    for (const key of Object.keys(result)) {
      const val = result[key];

      // Rewrite URL string fields
      if (URL_FIELDS.has(key) && typeof val === 'string') {
        result[key] = rewriteUrl(val, key);
        continue;
      }

      // Handle extra_data / extraData as JSON string
      if ((key === 'extra_data' || key === 'extraData') && typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === 'object') {
            const rewritten = rewriteUploadUrls(parsed);
            result[key] = JSON.stringify(rewritten);
          }
        } catch {
          // Not valid JSON, leave as-is
        }
        continue;
      }

      // Handle extra_data / extraData as already-parsed object
      if ((key === 'extra_data' || key === 'extraData') && typeof val === 'object' && val !== null) {
        result[key] = rewriteUploadUrls(val);
        continue;
      }

      // Recursively handle nested arrays (sections, cards, etc.)
      if (Array.isArray(val)) {
        result[key] = val.map((item: any) => rewriteUploadUrls(item));
        continue;
      }

      // Recursively handle nested objects (but skip Date/Buffer/etc.)
      if (val && typeof val === 'object' && !(val instanceof Date) && !(typeof Buffer !== 'undefined' && Buffer.isBuffer(val))) {
        result[key] = rewriteUploadUrls(val);
      }
    }
    return result as T;
  }

  return data;
}
