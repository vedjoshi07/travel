/**
 * theme-init-script.ts — synchronous inline script that runs *before* first paint
 * to apply the saved theme. Without this, the static export renders dark for
 * one frame and then flips to light when React hydrates, producing a visible
 * flash for users who prefer light mode.
 *
 * Returns the script as a string. Embed with `dangerouslySetInnerHTML` so it
 * runs synchronously and doesn't wait for hydration.
 *
 * The same shape is also exported as a runtime helper for client components
 * that need to read/override the theme imperatively.
 */

export function themeInitScript(): string {
  return `(function(){try{var raw=localStorage.getItem('nexus-store');var t='dark';if(raw){var p=JSON.parse(raw);t=(p&&p.state&&p.state.theme)||'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
}

export const THEME_STORAGE_KEY = 'nexus-store';
export const THEME_ATTR = 'data-theme';
export type ThemeName = 'dark' | 'light';

export function getStoredTheme(): ThemeName | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return (p?.state?.theme as ThemeName) ?? null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(THEME_ATTR, theme);
}