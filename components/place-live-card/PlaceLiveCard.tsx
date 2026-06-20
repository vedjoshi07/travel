'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, ChevronRight } from 'lucide-react';
import { usePlaceState } from '@/lib/hooks/use-place-state';
import { PlaceImage } from '@/components/place-image/PlaceImage';
import { NexusRing } from '@/components/nexus-ring/NexusRing';
import { formatDistance } from '@/lib/locale';
import { useAppStore } from '@/lib/store/app-store';
import { useEffect } from 'react';

interface PlaceLiveCardProps {
  placeId: string;
  name: string;
  category: string;
  distanceM: number;
  imageUrl?: string;
  onSelect?: (placeId: string) => void;
  variant?: 'default' | 'compact';
}

function toneForCrowd(p: number): 'signal' | 'beacon' | 'alert' {
  if (p < 35) return 'signal';
  if (p < 70) return 'beacon';
  return 'alert';
}

export function PlaceLiveCard({
  placeId,
  name,
  category,
  distanceM,
  imageUrl,
  onSelect,
  variant = 'default',
}: PlaceLiveCardProps) {
  const router = useRouter();
  const locale = useAppStore((s) => s.locale);
  const increment = useAppStore((s) => s.incrementExplorerScore);
  const { data: state, isLoading } = usePlaceState(placeId);

  // Bump the explorer score every time the user opens a place from a card.
  useEffect(() => {
    return () => {
      // We count on unmount — places get tracked when the user navigates
      // *away* from the home page, which is the closest proxy to "viewed."
      increment();
    };
  }, [increment]);

  function handleClick() {
    if (onSelect) onSelect(placeId);
    else router.push(`/place/${placeId}`);
  }

  const crowd = state?.crowdPercent;
  const score = state?.experienceScore;

  return (
    <motion.button
      onClick={handleClick}
      className="card"
      style={{
        width: '100%',
        padding: variant === 'compact' ? '12px 14px' : '14px',
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        flexDirection: variant === 'compact' ? 'row' : 'column',
        alignItems: variant === 'compact' ? 'center' : 'stretch',
        gap: variant === 'compact' ? 12 : 10,
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${name} — ${isLoading ? 'Loading' : `Crowd ${crowd}%, score ${score}`}. Tap to view details.`}
    >
      {variant === 'default' && imageUrl && (
        <PlaceImage
          src={imageUrl}
          alt={`${name} — ${category}`}
          category={category}
          height={140}
          rounded={12}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: variant === 'compact' ? '0.875rem' : '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 4,
            lineHeight: 1.2,
          }}>
            {name}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--beacon)', fontWeight: 600 }}>
              {category}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              {formatDistance(distanceM, locale)}
            </span>
            {state && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                <Clock size={10} aria-hidden="true" />
                {state.queueMinutes > 0 ? `~${state.queueMinutes} min wait` : 'No wait'}
              </span>
            )}
          </div>
        </div>

        {/* Inline Nexus Ring — the signature motif applied to every card */}
        {!isLoading && crowd !== undefined && (
          <NexusRing
            value={crowd}
            tone={toneForCrowd(crowd)}
            size="sm"
            label={String(crowd)}
            ariaLabel={`Crowd ${crowd}%`}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
        {isLoading ? (
          <span style={{
            height: 14, width: '60%', borderRadius: 4,
            background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite',
            display: 'inline-block',
          }} />
        ) : state ? (
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            Experience{' '}
            <span className="text-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {score}
            </span>
            /100 ·{' '}
            <span style={{
              color: state.trend === 'up' ? 'var(--signal)' :
                     state.trend === 'down' ? 'var(--alert)' :
                     'var(--text-muted)',
              fontWeight: 600,
            }}>
              {state.trend === 'up' ? '↑ rising' : state.trend === 'down' ? '↓ easing' : '→ steady'}
            </span>
          </span>
        ) : null}
        <ChevronRight size={14} aria-hidden="true" />
      </div>
    </motion.button>
  );
}