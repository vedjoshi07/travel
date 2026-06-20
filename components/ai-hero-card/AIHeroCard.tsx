'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Navigation, ArrowRight } from 'lucide-react';
import { asset } from '@/lib/base-path';

interface AIHeroCardProps {
  placeName: string;
  reasonBullets: string[];
  etaMinutes: number;
  actions: {
    primary: { label: string; onClick: () => void };
    secondary?: { label: string; onClick: () => void };
  };
  crowdPercent?: number;
  experienceScore?: number;
  imageUrl?: string;
  category?: string;
}

export function AIHeroCard({
  placeName,
  reasonBullets,
  etaMinutes,
  actions,
  crowdPercent,
  experienceScore,
  imageUrl,
  category,
}: AIHeroCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgErrored, setImgErrored] = useState(false);
  const showImage = !!imageUrl && !imgErrored;
  const resolvedImageUrl = imageUrl ? asset(imageUrl) : undefined;

  return (
    <motion.div
      className="glass-card-accent"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}
      role="region"
      aria-label="AI recommendation"
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,92,250,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Hero image (optional) — sits behind content, faded in once loaded */}
      {showImage && (
        <div style={{
          position: 'relative',
          margin: '-20px -20px 16px',
          height: 160,
          overflow: 'hidden',
          background: 'var(--color-surface-border)',
        }}>
          {!imgLoaded && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s ease-in-out infinite',
            }} aria-hidden="true" />
          )}
          <motion.img
            src={resolvedImageUrl}
            alt={placeName}
            loading="eager"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgErrored(true)}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: imgLoaded ? 1 : 0, scale: imgLoaded ? 1 : 1.05 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          {/* Category chip on the image */}
          {category && imgLoaded && (
            <span style={{
              position: 'absolute', top: 10, left: 10,
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'rgba(10, 14, 26, 0.75)',
              color: 'white',
              padding: '4px 9px',
              borderRadius: 100,
              backdropFilter: 'blur(8px)',
            }}>{category}</span>
          )}
          {/* Bottom fade so text below reads cleanly */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,14,26,0.85) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} aria-hidden="true" />
        </div>
      )}

      {/* AI label — beacon is reserved for AI-generated content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
          <Sparkles size={10} aria-hidden="true" />
          AI Recommendation
        </span>
      </div>

      {/* Place name */}
      <motion.h2
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.625rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}
      >
        {placeName}
      </motion.h2>

      {/* Stats chips */}
      {(crowdPercent !== undefined || experienceScore !== undefined) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {crowdPercent !== undefined && (
            <span className={`badge ${crowdPercent < 35 ? 'badge-signal' : crowdPercent < 70 ? 'badge-accent' : 'badge-alert'}`}>
              {crowdPercent}% crowd
            </span>
          )}
          {experienceScore !== undefined && (
            <span className={`badge ${experienceScore >= 80 ? 'badge-signal' : experienceScore >= 50 ? 'badge-accent' : 'badge-alert'}`}>
              Score {experienceScore}/100
            </span>
          )}
          <span className="badge badge-accent">
            <Navigation size={9} aria-hidden="true" />
            {etaMinutes} min away
          </span>
        </div>
      )}

      {/* Reason bullets */}
      <ul style={{ listStyle: 'none', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}
          aria-label="Reasons for this recommendation">
        {reasonBullets.slice(0, 4).map((bullet, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: 'var(--beacon)', marginTop: 2, flexShrink: 0 }} aria-hidden="true">✦</span>
            {bullet}
          </motion.li>
        ))}
      </ul>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn-primary"
          onClick={actions.primary.onClick}
          id="ai-hero-primary-action"
          style={{ flex: 1 }}
        >
          {actions.primary.label}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
        {actions.secondary && (
          <button
            className="btn-secondary"
            onClick={actions.secondary.onClick}
            id="ai-hero-secondary-action"
          >
            {actions.secondary.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}
