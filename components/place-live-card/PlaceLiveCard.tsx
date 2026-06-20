'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { usePlaceState } from '@/lib/hooks/use-place-state';
import { CrowdMeter } from '@/components/crowd-meter/CrowdMeter';
import { ExperienceScore } from '@/components/experience-score/ExperienceScore';

interface PlaceLiveCardProps {
  placeId: string;
  name: string;
  category: string;
  distanceM: number;
  onSelect?: (placeId: string) => void;
  variant?: 'default' | 'compact';
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

export function PlaceLiveCard({
  placeId,
  name,
  category,
  distanceM,
  onSelect,
  variant = 'default',
}: PlaceLiveCardProps) {
  const router = useRouter();
  const { data: state, isLoading } = usePlaceState(placeId);

  function handleClick() {
    if (onSelect) onSelect(placeId);
    else router.push(`/place/${placeId}`);
  }

  return (
    <motion.button
      onClick={handleClick}
      className="glass-card"
      style={{
        width: '100%',
        padding: variant === 'compact' ? '12px 14px' : '16px',
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${name} — ${isLoading ? 'Loading' : `Crowd ${state?.crowdPercent}%`}. Tap to view details.`}
    >
      {/* Accent line */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        borderRadius: '0 2px 2px 0',
        background: 'linear-gradient(to bottom, var(--color-accent), transparent)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 8 }}>
        <div>
          <div style={{
            fontSize: variant === 'compact' ? '0.85rem' : '0.95rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 2,
          }}>
            {name}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--color-accent-glow)',
              fontWeight: 500,
            }}>
              {category}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
              <MapPin size={10} aria-hidden="true" />
              {formatDistance(distanceM)}
            </span>
            {state && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                <Clock size={10} aria-hidden="true" />
                {state.queueMinutes > 0 ? `~${state.queueMinutes} min wait` : 'No wait'}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} color="var(--color-text-muted)" aria-hidden="true" />
      </div>

      {/* Stats row */}
      {!isLoading && state && variant !== 'compact' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 8,
          paddingTop: 4,
          borderTop: '1px solid var(--color-surface-border)',
        }}>
          <CrowdMeter percent={state.crowdPercent} size="sm" showLabel={true} />
          <ExperienceScore score={state.experienceScore} trend={state.trend} size="sm" />
        </div>
      )}

      {/* Compact just shows crowd % badge */}
      {!isLoading && state && variant === 'compact' && (
        <div style={{ paddingLeft: 8 }}>
          <CrowdMeter percent={state.crowdPercent} size="sm" showLabel={true} animated={false} />
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{
          height: 36,
          background: 'var(--color-surface-border)',
          borderRadius: 8,
          marginLeft: 8,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}
    </motion.button>
  );
}
