'use client';
import { useEffect } from 'react';

const DESKTOP_BREAKPOINT = 960;

/**
 * Adds `has-rail` to <body> when the viewport is at least the desktop
 * breakpoint. The CSS uses this class to swap bottom-nav for the rail and
 * offset main content. We do it via JS rather than relying on a container
 * query because we need to know whether to hide the bottom nav entirely.
 */
export function RailGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const apply = () => {
      document.body.classList.toggle('has-rail', mq.matches);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return <>{children}</>;
}