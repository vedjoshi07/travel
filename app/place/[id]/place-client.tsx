'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Clock, Volume2, Star,
  TrendingUp, Navigation
} from 'lucide-react';
import { usePlaceState } from '@/lib/hooks/use-place-state';
import { useForecast } from '@/lib/hooks/use-forecast';
import { MOCK_PLACES } from '@/lib/simulation/engine';
import { CrowdMeter } from '@/components/crowd-meter/CrowdMeter';
import { ExperienceScore } from '@/components/experience-score/ExperienceScore';
import { PredictionGraph } from '@/components/prediction-graph/PredictionGraph';
import { PlaceImage } from '@/components/place-image/PlaceImage';

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

export default function PlaceClientPage({ id }: { id: string }) {
  const router = useRouter();
  const place = MOCK_PLACES.find((p) => p.id === id);
  const { data: state, isLoading } = usePlaceState(id);
  const { data: forecast } = useForecast(id, 12);

  if (!place) {
    return (
      <div className="page-container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Place not found.</p>
        <button className="btn-secondary" onClick={() => router.back()} style={{ marginTop: 16 }}>
          Go back
        </button>
      </div>
    );
  }

  // Build forecast series for graph
  const now = new Date();
  const series = forecast?.map((f, i) => {
    const h = new Date(now.getTime() + i * 3600_000);
    return {
      hour: h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      crowdPercent: f.crowdPercent,
    };
  }) ?? [];

  // Find best window (min crowd 2-hour window)
  let bestStart = 0;
  let minAvg = Infinity;
  for (let i = 0; i < series.length - 1; i++) {
    const avg = (series[i].crowdPercent + series[i + 1].crowdPercent) / 2;
    if (avg < minAvg) { minAvg = avg; bestStart = i; }
  }
  const bestWindow = series.length > 1
    ? { start: series[bestStart]?.hour, end: series[Math.min(bestStart + 2, series.length - 1)]?.hour }
    : undefined;

  const noiseLabelMap = { quiet: '🤫 Quiet', comfortable: '💬 Comfortable', loud: '📢 Loud' };

  const statItems = [
    {
      label: 'Queue',
      value: state ? (state.queueMinutes > 0 ? `~${state.queueMinutes} min` : 'No wait') : '…',
      icon: <Clock size={14} color="var(--color-accent-glow)" aria-hidden="true" />,
      id: 'stat-queue',
    },
    {
      label: 'Noise',
      value: state ? (noiseLabelMap[state.noiseLevel]) : '…',
      icon: <Volume2 size={14} color="var(--color-accent-glow)" aria-hidden="true" />,
      id: 'stat-noise',
    },
    {
      label: 'Distance',
      value: formatDistance(place.distanceM),
      icon: <MapPin size={14} color="var(--color-accent-glow)" aria-hidden="true" />,
      id: 'stat-distance',
    },
    {
      label: 'Category',
      value: place.category,
      icon: <Star size={14} color="var(--color-accent-glow)" aria-hidden="true" />,
      id: 'stat-category',
    },
  ];

  return (
    <div className="page-container">
      {/* Back header */}
      <div className="page-header" style={{ paddingTop: 52 }}>
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
            id="place-back-btn"
          >
            <ArrowLeft size={16} color="var(--color-text-primary)" aria-hidden="true" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{place.name}</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-glow)' }}>{place.category}</span>
          </div>
        </div>
      </div>

      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 14 }}
      >
        <PlaceImage
          src={place.imageUrl}
          alt={place.name}
          category={place.category}
          height={200}
          rounded={20}
          credit={place.imageCredit}
          showCredit
          priority
        />
      </motion.div>

      {/* Hero metrics */}
      <motion.div
        className="glass-card-accent"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: 20, marginBottom: 14 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          {/* Crowd meter */}
          {!isLoading && state ? (
            <CrowdMeter percent={state.crowdPercent} size="lg" showLabel={true} />
          ) : (
            <div style={{ height: 60, width: 120, background: 'var(--color-surface-border)', borderRadius: 12 }} />
          )}
          {/* Experience score */}
          {!isLoading && state ? (
            <ExperienceScore score={state.experienceScore} trend={state.trend} size="lg" />
          ) : (
            <div style={{ height: 60, width: 100, background: 'var(--color-surface-border)', borderRadius: 12 }} />
          )}
        </div>

        {/* Live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-status-good)',
            boxShadow: '0 0 6px var(--color-status-good)',
            display: 'inline-block',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }} aria-hidden="true" />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-status-good)', fontWeight: 600 }}>
            LIVE — updates every 15s
          </span>
        </div>
      </motion.div>

      {/* Stat grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 14,
      }}>
        {statItems.map((item, i) => (
          <motion.div
            key={item.id}
            id={item.id}
            className="glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              {item.icon}
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                {item.label}
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {item.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Forecast section */}
      <motion.section
        className="glass-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: '14px 16px', marginBottom: 14 }}
        aria-label="12-hour crowd forecast"
      >
        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-text-primary)' }}>
          12-Hour Forecast
        </h2>
        {series.length > 0 ? (
          <PredictionGraph series={series} bestWindow={bestWindow} height={160} />
        ) : (
          <div style={{ height: 160, background: 'var(--color-surface-border)', borderRadius: 10 }} />
        )}
      </motion.section>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, paddingBottom: 16 }}>
        <button
          className="btn-primary"
          style={{ flex: 1 }}
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
      </div>
    </div>
  );
}
