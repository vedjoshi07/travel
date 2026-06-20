'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Clock, Volume2, Star,
  TrendingUp, Navigation, Bell, BellOff, Share2
} from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { usePlaceState } from '@/lib/hooks/use-place-state';
import { useForecast } from '@/lib/hooks/use-forecast';
import { MOCK_PLACES } from '@/lib/simulation/engine';
import { PlaceImage } from '@/components/place-image/PlaceImage';
import { NexusRing } from '@/components/nexus-ring/NexusRing';
import { PredictionGraph } from '@/components/prediction-graph/PredictionGraph';
import { formatDistance, formatTime } from '@/lib/locale';
import { useAppStore } from '@/lib/store/app-store';

function toneForCrowd(p: number): 'signal' | 'beacon' | 'alert' {
  if (p < 35) return 'signal';
  if (p < 70) return 'beacon';
  return 'alert';
}

export default function PlaceClientPage({ id }: { id: string }) {
  const router = useRouter();
  const place = MOCK_PLACES.find((p) => p.id === id);
  const locale = useAppStore((s) => s.locale);
  const watchedPlaces = useAppStore((s) => s.watchedPlaces);
  const watchPlace = useAppStore((s) => s.watchPlace);
  const unwatchPlace = useAppStore((s) => s.unwatchPlace);

  const { data: state } = usePlaceState(id);
  const { data: forecast } = useForecast(id, 12);

  // Live "as of" clock. useSyncExternalStore avoids the React 19 setState-in-
  // effect warning while keeping SSR happy (server snapshot returns null).
  const now = useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, 1000);
      return () => clearInterval(id);
    },
    () => new Date(),
    () => null,
  );

  const watching = watchedPlaces.includes(id);

  if (!place) {
    return (
      <div className="page-container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Place not found.</p>
        <button className="btn-secondary" onClick={() => router.back()} style={{ marginTop: 16 }}>
          Go back
        </button>
      </div>
    );
  }

  const series = forecast?.map((f, i) => {
    // Base hour on the live clock snapshot (same source as the "as of"
    // label below). Fall back to 0 if we're in SSR.
    const baseMs = now?.getTime() ?? 0;
    const h = new Date(baseMs + i * 3600_000);
    return {
      hour: formatTime(h, locale),
      crowdPercent: f.crowdPercent,
    };
  }) ?? [];

  let bestStart = 0;
  let minAvg = Infinity;
  for (let i = 0; i < series.length - 1; i++) {
    const avg = (series[i].crowdPercent + series[i + 1].crowdPercent) / 2;
    if (avg < minAvg) { minAvg = avg; bestStart = i; }
  }
  const bestWindow = series.length > 1
    ? { start: series[bestStart]?.hour, end: series[Math.min(bestStart + 2, series.length - 1)]?.hour }
    : undefined;

  const noiseLabelMap = { quiet: 'Quiet', comfortable: 'Comfortable', loud: 'Loud' };

  const statItems = [
    {
      label: 'Queue',
      value: state ? (state.queueMinutes > 0 ? `~${state.queueMinutes} min` : 'No wait') : '…',
      icon: <Clock size={14} color="var(--beacon)" aria-hidden="true" />,
    },
    {
      label: 'Noise',
      value: state ? (noiseLabelMap[state.noiseLevel]) : '…',
      icon: <Volume2 size={14} color="var(--beacon)" aria-hidden="true" />,
    },
    {
      label: 'Distance',
      value: formatDistance(place.distanceM, locale),
      icon: <MapPin size={14} color="var(--beacon)" aria-hidden="true" />,
    },
    {
      label: 'Category',
      value: place.category,
      icon: <Star size={14} color="var(--beacon)" aria-hidden="true" />,
    },
  ];

  const crowd = state?.crowdPercent;
  const score = state?.experienceScore;
  const crowdTone = crowd !== undefined ? toneForCrowd(crowd) : 'signal';
  const scoreTone = score !== undefined
    ? (score >= 80 ? 'signal' : score >= 50 ? 'beacon' : 'alert')
    : 'signal';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 52 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                borderRadius: 12,
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                minWidth: 44,
                minHeight: 44,
                color: 'var(--text-primary)',
              }}
              aria-label="Go back"
              id="place-back-btn"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 700,
                lineHeight: 1.2,
              }}>{place.name}</h1>
              <span style={{ fontSize: '0.6875rem', color: 'var(--beacon)', fontWeight: 600 }}>{place.category}</span>
            </div>
          </div>
          <button
            onClick={() => (watching ? unwatchPlace(id) : watchPlace(id))}
            id="place-watch-btn"
            className="btn-secondary"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', minHeight: 44 }}
            aria-label={watching ? 'Stop watching this place for alerts' : 'Watch this place for crowd alerts'}
            aria-pressed={watching}
          >
            {watching
              ? <><Bell size={12} aria-hidden="true" /> Watching</>
              : <><BellOff size={12} aria-hidden="true" /> Watch</>}
          </button>
        </div>
      </div>

      {/* Hero image — same `asset()`-resolved URL pipeline as the rest */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 14 }}
      >
        <PlaceImage
          src={place.imageUrl}
          alt={`${place.name} — ${place.category}`}
          category={place.category}
          height={220}
          rounded={20}
          credit={place.imageCredit}
          showCredit
          priority
        />
      </motion.div>

      {/* Hero metrics — the two Nexus Rings side by side. The single clock
          lives in the LIVE label below; we no longer display a redundant
          timestamp elsewhere on this screen. */}
      <motion.div
        className="card-accent"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: 20, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Crowd Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <NexusRing
              value={crowd ?? 0}
              tone={crowdTone}
              size="lg"
              live
              ariaLabel={`Current crowd level ${crowd ?? '?'} percent — ${crowdTone === 'signal' ? 'low' : crowdTone === 'beacon' ? 'medium' : 'high'}`}
            />
            <span className="text-label">Crowd now</span>
          </div>
          {/* Score Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <NexusRing
              value={score ?? 0}
              tone={scoreTone}
              size="lg"
              ariaLabel={`Experience score ${score ?? '?'} out of 100`}
            />
            <span className="text-label">Experience</span>
          </div>
        </div>

        {/* Live label with single clock */}
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 100, background: 'var(--signal-dim)', border: '1px solid var(--signal-border)', alignSelf: 'flex-start' }}
        >
          <span className="nexus-ring__live" aria-hidden="true" style={{ position: 'static' }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--signal)', fontWeight: 700, letterSpacing: '0.04em' }}>
            LIVE
          </span>
          {now && (
            <span className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--signal)' }}>
              as of {formatTime(now, locale, { seconds: true })}
            </span>
          )}
          <span style={{ fontSize: '0.6875rem', color: 'var(--signal)', opacity: 0.7 }}>· 15s refresh</span>
        </div>
      </motion.div>

      {/* Stat grid */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        {statItems.map((item, i) => (
          <motion.div
            key={item.label}
            className="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              {item.icon}
              <span className="text-label">{item.label}</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {item.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Forecast section */}
      <motion.section
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: '14px 16px', marginBottom: 14 }}
        aria-label="12-hour crowd forecast"
      >
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9375rem',
          fontWeight: 700,
          marginBottom: 12,
          color: 'var(--text-primary)',
        }}>
          12-Hour Forecast
        </h2>
        {series.length > 0 ? (
          <PredictionGraph series={series} bestWindow={bestWindow} height={170} />
        ) : (
          <div style={{ height: 170, background: 'var(--surface-2)', borderRadius: 10 }} aria-hidden="true" />
        )}
      </motion.section>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, paddingBottom: 16, flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          style={{ flex: 1, minWidth: 160 }}
          onClick={() => router.push(`/forecast/${id}`)}
          id="place-forecast-btn"
        >
          <TrendingUp size={14} aria-hidden="true" />
          Full Forecast
        </button>
        <button
          className="btn-secondary"
          onClick={() => router.push('/chat')}
          id="place-plan-btn"
        >
          <Navigation size={14} aria-hidden="true" />
          Plan Visit
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            // Best-effort share — clipboard is the universal fallback.
            const shareText = `Check ${place.name} on NEXUS — live crowd ${crowd ?? '?'}%, score ${score ?? '?'}/100.`;
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({ title: place.name, text: shareText }).catch(() => {});
            } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(shareText).catch(() => {});
            }
          }}
          aria-label="Share this place"
          id="place-share-btn"
        >
          <Share2 size={14} aria-hidden="true" />
          Share
        </button>
      </div>
    </div>
  );
}