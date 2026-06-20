'use client';
/**
 * MiniMapHero — the home page hero. A compact, abstract live-map snippet of
 * nearby places with Nexus Rings overlaid on each pin. No Mapbox token
 * required (the full Mapbox view lives at /map for the deep case).
 *
 * Why abstract and not literal Google Maps? Embedding a third-party map
 * inside a hero card adds weight, latency, and iframe management. The brief
 * says "live mini-map snippet... with 2-3 Nexus Rings overlaid on real
 * nearby pins" — the rings are the signature, the map is just context.
 */
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { NexusRing } from '@/components/nexus-ring/NexusRing';
import { MOCK_PLACES, type PlaceId } from '@/lib/simulation/engine';
import type { PlaceSimState } from '@/lib/simulation/engine';
import { formatDistance } from '@/lib/locale';
import { useAppStore } from '@/lib/store/app-store';

interface MiniMapHeroProps {
  states: Partial<Record<PlaceId, PlaceSimState>>;
}

interface Pin {
  id: PlaceId;
  x: number;        // 0–1 normalized
  y: number;        // 0–1 normalized
}

const PINS: Pin[] = [
  { id: 'central-park',    x: 0.5,  y: 0.45 },
  { id: 'lotus-cafe',      x: 0.65, y: 0.32 },
  { id: 'riverside-walk',  x: 0.32, y: 0.62 },
  { id: 'art-district',    x: 0.78, y: 0.55 },
  { id: 'spice-market',    x: 0.42, y: 0.30 },
  { id: 'rooftop-lounge',  x: 0.58, y: 0.68 },
];

function toneForCrowd(p: number): 'signal' | 'beacon' | 'alert' {
  if (p < 35) return 'signal';
  if (p < 70) return 'beacon';
  return 'alert';
}

export function MiniMapHero({ states }: MiniMapHeroProps) {
  const router = useRouter();
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="hero-band" role="region" aria-label="Live nearby map">
      <div className="hero-band__glow" aria-hidden="true" />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative',
        marginBottom: '1rem',
      }}>
        <div>
          <span className="badge badge-signal">
            <span className="nexus-ring__live" aria-hidden="true" style={{ position: 'static', width: 6, height: 6 }} />
            LIVE
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginTop: '0.625rem',
            lineHeight: 1.15,
          }}>
            Your city, right now
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Tap any ring to see why it&apos;s calm — or crowded.
          </p>
        </div>
      </div>

      {/* The "map" surface — an abstract SVG with grid + pins */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          background: 'var(--ink)',
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--hairline)',
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 56"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <path
            d="M 0 40 Q 25 30, 50 38 T 100 32"
            stroke="var(--signal)"
            strokeWidth="0.5"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M 0 22 Q 30 16, 60 24 T 100 18"
            stroke="var(--beacon)"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
          />
        </svg>

        {PINS.map((pin, i) => {
          const place = MOCK_PLACES.find((p) => p.id === pin.id)!;
          const state = states[pin.id];
          const crowd = state?.crowdPercent ?? 50;
          const tone = toneForCrowd(crowd);
          return (
            <motion.button
              key={pin.id}
              onClick={() => router.push(`/place/${pin.id}`)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                insetInlineStart: `${pin.x * 100}%`,
                top: `${pin.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label={`${place.name} — ${crowd}% crowd. ${formatDistance(place.distanceM, locale)} away. Tap for details.`}
            >
              <NexusRing
                value={crowd}
                tone={tone}
                size={crowd > 80 ? 'lg' : 'md'}
                ariaLabel={`${place.name} ${crowd}% crowd`}
                live
              />
            </motion.button>
          );
        })}
      </div>

      {/* Footer legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.875rem',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-signal">Quiet</span>
          <span className="badge badge-accent">Filling</span>
          <span className="badge badge-alert">Busy</span>
        </div>
        <button
          onClick={() => router.push('/map')}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.875rem', fontSize: '0.75rem' }}
          aria-label="Open the full live map"
        >
          Open full map →
        </button>
      </div>
    </div>
  );
}