/**
 * Centralized helper for static asset URLs.
 *
 * The app is exported with `basePath: '/travel'` (see next.config.ts). When the
 * static bundle is served from a sub-path, plain root-relative `<img src="/foo">`
 * requests miss — they hit `/foo` instead of `/travel/foo`. Wrap every public
 * asset URL through this so the basePath is always applied consistently.
 *
 * Usage:
 *   <img src={asset("/places/spice-market.jpg")} />
 */

const BASE_PATH = '/travel';

export function asset(path: string): string {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith(BASE_PATH + '/') || normalized === BASE_PATH) {
    return normalized;
  }
  return `${BASE_PATH}${normalized}`;
}

/** Strip the basePath prefix when comparing / matching absolute URLs. */
export function withoutBasePath(path: string): string {
  if (path.startsWith(BASE_PATH + '/')) return path.slice(BASE_PATH.length);
  if (path === BASE_PATH) return '/';
  return path;
}