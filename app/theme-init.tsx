'use client';
import { useEffect } from 'react';

/** Reads persisted theme from localStorage and applies it before first paint */
export function ThemeInit() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexus-store');
      if (stored) {
        const parsed = JSON.parse(stored);
        const theme = parsed?.state?.theme ?? 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch {
      // fallback — keep default dark
    }
  }, []);
  return null;
}
