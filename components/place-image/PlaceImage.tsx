'use client';
/**
 * PlaceImage — small, reusable image with loading + error states.
 *
 * Renders a Wikimedia (or any HTTPS) image with:
 *  - a shimmer placeholder while loading
 *  - a category-tinted gradient + icon fallback if the URL 404s / is slow
 *  - subtle fade-in on success
 *  - a tiny credit line for attribution
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';

const CATEGORY_GRADIENT: Record<string, string> = {
  Park:    'linear-gradient(135deg, #2ECC71 0%, #1E3A6E 100%)',
  Café:    'linear-gradient(135deg, #F4C430 0%, #6A4CE8 100%)',
  Walk:    'linear-gradient(135deg, #60A5FA 0%, #2ECC71 100%)',
  Culture: 'linear-gradient(135deg, #E74C3C 0%, #7B5CFA 100%)',
  Market:  'linear-gradient(135deg, #F4C430 0%, #E74C3C 100%)',
  Bar:     'linear-gradient(135deg, #7B5CFA 0%, #0B1B3D 100%)',
  Beach:   'linear-gradient(135deg, #60A5FA 0%, #2ECC71 100%)',
};

interface PlaceImageProps {
  src?: string;
  alt: string;
  category: string;
  height?: number | string;
  rounded?: number;
  credit?: string;
  showCredit?: boolean;
  priority?: boolean; // set true to disable lazy loading (above-the-fold)
}

export function PlaceImage({
  src,
  alt,
  category,
  height = 160,
  rounded = 14,
  credit,
  showCredit = false,
  priority = false,
}: PlaceImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const fallbackGradient = CATEGORY_GRADIENT[category] ?? 'linear-gradient(135deg, #7B5CFA, #0B1B3D)';

  // No URL at all → render the gradient fallback directly
  if (!src || errored) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{
          width: '100%',
          height,
          borderRadius: rounded,
          background: fallbackGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle pattern so a flat gradient doesn't look empty */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 30% 30%, rgba(255,255,255,0.18) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.85 }}>
          <ImageOff size={18} aria-hidden="true" />
          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em' }}>{category}</span>
        </div>
        {showCredit && credit && (
          <span style={{
            position: 'absolute', bottom: 4, right: 6,
            fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}>{credit}</span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: rounded,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-surface-border)',
      }}
    >
      {/* Shimmer while loading */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }} aria-hidden="true" />
      )}
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      {/* Subtle bottom gradient for legibility when text overlays the image */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 35%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />
      {showCredit && credit && (
        <span style={{
          position: 'absolute', bottom: 4, right: 6,
          fontSize: '0.55rem', color: 'rgba(255,255,255,0.75)',
          textShadow: '0 1px 2px rgba(0,0,0,0.7)',
        }}>{credit}</span>
      )}
    </div>
  );
}
