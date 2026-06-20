'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useForecast } from '@/lib/hooks/use-forecast';
import { MOCK_PLACES } from '@/lib/simulation/engine';
import { PredictionGraph } from '@/components/prediction-graph/PredictionGraph';

// Default /forecast route — shows top 6 places in a responsive 2-col grid
// on wider viewports, single-col on phones. Each card links to its full
// forecast view at /forecast/[id].
export default function ForecastIndexPage() {
  const router = useRouter();
  const topPlaces = MOCK_PLACES.slice(0, 6);

  return (
    <div className="page-container">
      <div className="page-header" style={{ paddingTop: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="var(--color-accent-glow)" aria-hidden="true" />
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Prediction Engine</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>12-hour crowd forecasts</p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 14,
        }}
      >
        {topPlaces.map((place) => (
          <ForecastCard key={place.id} place={place} onSelect={() => router.push(`/forecast/${place.id}`)} />
        ))}
      </div>
    </div>
  );
}

function ForecastCard({ place, onSelect }: {
  place: typeof MOCK_PLACES[number];
  onSelect: () => void;
}) {
  const { data: forecast } = useForecast(place.id, 12);
  const now = new Date();
  const series = forecast?.map((f, i) => {
    const h = new Date(now.getTime() + i * 3600_000);
    return {
      hour: h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      crowdPercent: f.crowdPercent,
    };
  }) ?? [];

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '14px 16px', cursor: 'pointer' }}
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-label={`View full forecast for ${place.name}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{place.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-glow)' }}>{place.category}</div>
        </div>
        <span className="badge badge-accent">12h forecast</span>
      </div>
      {series.length > 0 && <PredictionGraph series={series} height={120} />}
    </motion.div>
  );
}
