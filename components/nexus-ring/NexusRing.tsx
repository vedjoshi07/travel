'use client';
/**
 * NexusRing — the single recurring signature motif of NEXUS.
 *
 * Used everywhere a number carries meaning: crowd %, experience score,
 * weather "feel," AI confidence. The fill animates from 0 → value on mount
 * and skips the animation entirely when prefers-reduced-motion is set.
 *
 * Design rule: this is the one place we spend visual boldness. Everything
 * around the ring stays quiet.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { animate, motion } from 'framer-motion';

export type RingTone = 'signal' | 'beacon' | 'alert' | 'mid';
export type RingSize = 'sm' | 'md' | 'lg' | 'xl';

interface NexusRingProps {
  value: number;                 // 0–100
  max?: number;                  // default 100
  tone?: RingTone;               // default signal
  size?: RingSize;               // default md
  label?: string;                // short text inside the ring
  ariaLabel?: string;            // full accessible label
  live?: boolean;                // show the pulsing dot — only when data IS live
  className?: string;
}

/** Subscribe to the user's prefers-reduced-motion preference. SSR-safe. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

export function NexusRing({
  value,
  max = 100,
  tone = 'signal',
  size = 'md',
  label,
  ariaLabel,
  live = false,
  className,
}: NexusRingProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const clamped = Math.max(0, Math.min(max, value));
  const fraction = clamped / max;

  // Geometric constants — kept in sync with CSS variables on .nexus-ring.
  const sizes: Record<RingSize, { size: number; stroke: number }> = {
    sm: { size: 36,  stroke: 3 },
    md: { size: 56,  stroke: 4 },
    lg: { size: 80,  stroke: 5 },
    xl: { size: 120, stroke: 6 },
  };
  const { size: px, stroke } = sizes[size];
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  // We animate stroke-dashoffset directly (motion + a pathLength ref).
  // When reduced-motion is on we skip to the final value with no tween.
  return (
    <span
      className={`nexus-ring ${className ?? ''}`}
      data-tone={tone}
      data-size={size}
      role="img"
      aria-label={ariaLabel ?? label ?? `${clamped} of ${max}`}
    >
      <svg
        ref={ref}
        className="nexus-ring__svg"
        viewBox={`0 0 ${px} ${px}`}
        aria-hidden="true"
      >
        <circle
          className="nexus-ring__track"
          cx={px / 2}
          cy={px / 2}
          r={radius}
        />
        <motion.circle
          className="nexus-ring__fill"
          cx={px / 2}
          cy={px / 2}
          r={radius}
          stroke="currentColor"
          initial={false}
          animate={{ strokeDashoffset: dashOffset }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
          }
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <span className="nexus-ring__value" aria-hidden="true">
        {label ?? Math.round(clamped)}
      </span>
      {live && <span className="nexus-ring__live" aria-hidden="true" />}
    </span>
  );
}

/**
 * AnimatedNumber — a number that tweens to its target value.
 * Used independently of the ring for places where a number should "feel live"
 * (tickers, score readouts) but we don't want the ring form factor.
 */
export function AnimatedNumber({
  value,
  duration = 0.7,
  format = (v) => Math.round(v).toString(),
}: {
  value: number;
  duration?: number;
  format?: (v: number) => string;
}) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (reduced) {
      // When reduced-motion is on we just snap to the final value. We don't
      // call setDisplay here — the dependency array re-runs only on change,
      // and `display` is initialised from the first `value` it sees.
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, reduced]);

  // When reduced motion is on, render the target value directly — no state.
  const shown = reduced ? value : display;

  return (
    <span className="text-mono" aria-live="polite">
      {format(shown)}
    </span>
  );
}