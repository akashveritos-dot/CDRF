/**
 * Rewrites raw /uploads/ URLs to the secure /api/files/ serve route.
 * This handles both old URLs stored in the database and new URLs.
 * External URLs (https://) are passed through unchanged.
 */
export function getSecureFileUrl(url: string | undefined | null): string {
  if (!url || url === '#') return '';
  
  // External URLs pass through unchanged
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Already using secure route
  if (url.startsWith('/api/files/')) {
    return url;
  }
  
  // Rewrite /uploads/filename to /api/files/filename
  if (url.startsWith('/uploads/')) {
    const fileName = url.replace('/uploads/', '');
    return `/api/files/${fileName}`;
  }
  
  // For anything else, return as-is
  return url;
}

/**
 * Check if a URL is a raw /uploads/ path that needs rewriting.
 */
export function isRawUploadUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('/uploads/');
}
