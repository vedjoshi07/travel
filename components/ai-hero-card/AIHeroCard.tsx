'use client';
import { motion } from 'framer-motion';
import { Sparkles, Navigation, ArrowRight } from 'lucide-react';

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
}

export function AIHeroCard({
  placeName,
  reasonBullets,
  etaMinutes,
  actions,
  crowdPercent,
  experienceScore,
}: AIHeroCardProps) {
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

      {/* AI label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex' }}
        >
          <Sparkles size={14} color="var(--color-accent-glow)" aria-hidden="true" />
        </motion.div>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-accent-glow)',
        }}>
          AI Recommendation
        </span>
      </div>

      {/* Place name */}
      <motion.h2
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: '1.6rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {placeName}
      </motion.h2>

      {/* Stats chips */}
      {(crowdPercent !== undefined || experienceScore !== undefined) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {crowdPercent !== undefined && (
            <span className={`badge badge-${crowdPercent < 35 ? 'good' : crowdPercent < 70 ? 'mid' : 'bad'}`}>
              {crowdPercent < 35 ? '🟢' : crowdPercent < 70 ? '🟡' : '🔴'} {crowdPercent}% crowd
            </span>
          )}
          {experienceScore !== undefined && (
            <span className={`badge badge-${experienceScore >= 80 ? 'good' : experienceScore >= 50 ? 'mid' : 'bad'}`}>
              ⭐ {experienceScore}/100
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
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: 'var(--color-accent-glow)', marginTop: 2, flexShrink: 0 }} aria-hidden="true">✦</span>
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
