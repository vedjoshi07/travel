'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BellOff, TrendingUp } from 'lucide-react';
import { usePlaceState } from '@/lib/hooks/use-place-state';
import { useForecast } from '@/lib/hooks/use-forecast';
import { MOCK_PLACES } from '@/lib/simulation/engine';
import { PredictionGraph } from '@/components/prediction-graph/PredictionGraph';
import { AlertBanner } from '@/components/alert-banner/AlertBanner';
import { PlaceLiveCard } from '@/components/place-live-card/PlaceLiveCard';

const CROWD_THRESHOLD = 70; // alert fires above this

export default function ForecastClientPage({ id }: { id: string }) {
  const router = useRouter();
  const place = MOCK_PLACES.find((p) => p.id === id) ?? MOCK_PLACES[0];
  const { data: state } = usePlaceState(place.id);
  const { data: forecast } = useForecast(place.id, 24);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [watching, setWatching] = useState(true);

  // Build series from forecast
  const now = new Date();
  const series = forecast?.map((f, i) => {
    const h = new Date(now.getTime() + i * 3600_000);
    return {
      hour: h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      crowdPercent: f.crowdPercent,
    };
  }) ?? [];

  // Best 2-hour window
  let bestStart = 0;
  let minAvg = Infinity;
  for (let i = 0; i < series.length - 1; i++) {
    const avg = (series[i].crowdPercent + series[i + 1].crowdPercent) / 2;
    if (avg < minAvg) { minAvg = avg; bestStart = i; }
  }
  const bestWindow = series.length > 1
    ? { start: series[bestStart]?.hour, end: series[Math.min(bestStart + 2, series.length - 1)]?.hour }
    : undefined;

  // Alert: fires when current crowd > threshold
  const isCrowded = (state?.crowdPercent ?? 0) > CROWD_THRESHOLD;
  const showAlert = watching && isCrowded && !alertDismissed;

  // Alternatives: pick 2 places with lower crowd
  const alternatives = MOCK_PLACES
    .filter((p) => p.id !== place.id)
    .slice(0, 2);

  // Stats breakdown
  const peakHour = series.reduce((max, s) => s.crowdPercent > (max?.crowdPercent ?? 0) ? s : max, series[0]);
  const quietHour = series.reduce((min, s) => s.crowdPercent < (min?.crowdPercent ?? 100) ? s : min, series[0]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 52 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-surface-border)',
                borderRadius: 12,
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Go back"
              id="forecast-back-btn"
            >
              <ArrowLeft size={16} color="var(--color-text-primary)" aria-hidden="true" />
            </button>
            <div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Prediction Engine</h1>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{place.name}</span>
            </div>
          </div>
          <button
            onClick={() => setWatching(!watching)}
            id="forecast-watch-btn"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            aria-label={watching ? 'Stop watching this place' : 'Watch this place for alerts'}
            aria-pressed={watching}
          >
            {watching
              ? <><Bell size={12} aria-hidden="true" /> Watching</>
              : <><BellOff size={12} aria-hidden="true" /> Watch</>
            }
          </button>
        </div>
      </div>

      {/* Alert banner */}
      <AlertBanner
        visible={showAlert}
        message={`${place.name} is at ${state?.crowdPercent}% capacity — above your threshold`}
        comparison={
          alternatives[0]
            ? {
                oldOption: place.name,
                oldStat: `${state?.crowdPercent ?? 0}% full`,
                newOption: alternatives[0].name,
                newStat: 'less crowded',
              }
            : undefined
        }
        onDismiss={() => setAlertDismissed(true)}
        onAction={() => router.push(`/forecast/${alternatives[0]?.id}`)}
        actionLabel="Switch"
      />

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Now', value: `${state?.crowdPercent ?? '…'}%`, color: state ? (state.crowdPercent < 35 ? 'var(--color-status-good)' : state.crowdPercent < 70 ? 'var(--color-status-mid)' : 'var(--color-status-bad)') : 'var(--color-text-secondary)' },
          { label: 'Peak', value: peakHour ? peakHour.hour : '…', color: 'var(--color-status-bad)' },
          { label: 'Quietest', value: quietHour ? quietHour.hour : '…', color: 'var(--color-status-good)' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            style={{ padding: '12px 10px', textAlign: 'center' }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: stat.color, fontVariantNumeric: 'tabular-nums' }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 24-hour graph */}
      <motion.section
        className="glass-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{ padding: '14px 16px', marginBottom: 14 }}
        aria-label="24-hour crowd prediction chart"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            24-Hour Crowd Prediction
          </h2>
          <span className="badge badge-accent">
            <TrendingUp size={9} aria-hidden="true" />
            AI Forecast
          </span>
        </div>
        {series.length > 0 ? (
          <PredictionGraph series={series} bestWindow={bestWindow} height={200} />
        ) : (
          <div style={{ height: 200, background: 'var(--color-surface-border)', borderRadius: 10 }} />
        )}
      </motion.section>

      {/* Alternatives */}
      <section aria-label="Alternative places">
        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 10 }}>
          Try Instead
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alternatives.map((alt) => (
            <PlaceLiveCard
              key={alt.id}
              placeId={alt.id}
              name={alt.name}
              category={alt.category}
              distanceM={alt.distanceM}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
