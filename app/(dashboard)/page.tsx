'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Wind, Shield, Calendar, Zap } from 'lucide-react';
import { useCityState } from '@/lib/hooks/use-city-state';
import { usePlaceState } from '@/lib/hooks/use-place-state';
import { useAppStore } from '@/lib/store/app-store';
import { useSimClock } from '@/lib/simulation/sim-clock-context';
import { MOCK_PLACES } from '@/lib/simulation/engine';
import { AIHeroCard } from '@/components/ai-hero-card/AIHeroCard';
import { AlertBanner } from '@/components/alert-banner/AlertBanner';
import { PlaceLiveCard } from '@/components/place-live-card/PlaceLiveCard';
import { useState, useEffect } from 'react';

// ─── Live clock ticker ────────────────────────────────────────────────────────

function LiveTicker() {
  const { simOffsetMinutes } = useSimClock();
  const [tick, setTick] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const displayTime = new Date(tick.getTime() + simOffsetMinutes * 60_000);
  const timeStr = displayTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const isSimulated = simOffsetMinutes !== 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isSimulated && (
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          color: 'var(--color-accent-glow)',
          background: 'rgba(123,92,250,0.15)',
          border: '1px solid rgba(123,92,250,0.3)',
          borderRadius: 100,
          padding: '2px 7px',
        }}>
          SIM
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--color-status-good)',
          boxShadow: '0 0 6px var(--color-status-good)',
          display: 'inline-block',
          animation: 'pulse-glow 3s ease-in-out infinite',
          flexShrink: 0,
        }} aria-hidden="true" />
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {timeStr}
        </span>
      </div>
    </div>
  );
}

// ─── City Status Bar ─────────────────────────────────────────────────────────

function CityStatusBar() {
  const { data: city, isLoading } = useCityState();

  const trafficColor =
    city?.trafficLevel === 'low' ? 'var(--color-status-good)' :
    city?.trafficLevel === 'medium' ? 'var(--color-status-mid)' :
    'var(--color-status-bad)';

  const statusItems = [
    {
      icon: <span style={{ fontSize: '1.1rem' }} aria-hidden="true">{city?.weatherIcon ?? '🌤️'}</span>,
      label: 'Weather',
      value: city ? `${city.weatherC}°C` : '--',
      sub: city?.weatherLabel ?? '…',
      id: 'city-weather',
    },
    {
      icon: <Wind size={14} color={trafficColor} aria-hidden="true" />,
      label: 'Traffic',
      value: city?.trafficLevel ?? '--',
      sub: 'City-wide',
      valueColor: trafficColor,
      id: 'city-traffic',
    },
    {
      icon: <Shield size={14} color="var(--color-status-good)" aria-hidden="true" />,
      label: 'Safety',
      value: city ? `${city.safetyScore}` : '--',
      sub: '/ 100',
      valueColor: 'var(--color-status-good)',
      id: 'city-safety',
    },
    {
      icon: <Calendar size={14} color="var(--color-accent-glow)" aria-hidden="true" />,
      label: 'Events',
      value: city ? `${city.activeEvents}` : '--',
      sub: 'Active',
      valueColor: 'var(--color-accent-glow)',
      id: 'city-events',
    },
  ];

  return (
    <div
      role="region"
      aria-label="City status overview"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        marginBottom: 16,
      }}
    >
      {statusItems.map((item, i) => (
        <motion.div
          key={item.id}
          id={item.id}
          className="glass-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '10px 8px', textAlign: 'center' }}
        >
          <div style={{ marginBottom: 4 }}>{item.icon}</div>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: item.valueColor ?? 'var(--color-text-primary)',
            lineHeight: 1.2,
            textTransform: 'capitalize',
          }}>
            {isLoading ? '…' : item.value}
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {item.sub}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Smart AI Hero ────────────────────────────────────────────────────────────

function SmartHero() {
  const router = useRouter();
  const candidates = [
    { place: MOCK_PLACES[0], hook: usePlaceState('central-park') },
    { place: MOCK_PLACES[1], hook: usePlaceState('lotus-cafe') },
    { place: MOCK_PLACES[2], hook: usePlaceState('riverside-walk') },
    { place: MOCK_PLACES[5], hook: usePlaceState('rooftop-lounge') },
  ];

  const best = candidates.reduce((prev, cur) =>
    (cur.hook.data?.experienceScore ?? 0) > (prev.hook.data?.experienceScore ?? 0) ? cur : prev
  );

  const state = best.hook.data;
  const { simOffsetMinutes } = useSimClock();
  const simHour = ((new Date().getHours() * 60 + new Date().getMinutes() + simOffsetMinutes) % (24 * 60)) / 60;
  const timeCtx = simHour < 12 ? 'morning' : simHour < 17 ? 'afternoon' : 'evening';

  const reasonsMap: Record<string, string[]> = {
    'central-park': [
      `Only ${state?.crowdPercent ?? '?'}% crowd — open & breezy right now`,
      `Perfect for a ${timeCtx} jog or picnic`,
      `Score: ${state?.experienceScore ?? '?'}/100 — top pick this hour`,
      `${state?.queueMinutes === 0 ? 'Walk right in, no queue' : `~${state?.queueMinutes} min queue`}`,
    ],
    'lotus-cafe': [
      `Just ${state?.crowdPercent ?? '?'}% full — grab your spot now`,
      `${timeCtx === 'morning' ? 'Ideal for a slow morning coffee' : 'Cozy & calm for the ' + timeCtx}`,
      `Score: ${state?.experienceScore ?? '?'}/100 — highest nearby`,
      `~${state?.queueMinutes ?? 0} min wait — get in before it fills up`,
    ],
    'riverside-walk': [
      `Peaceful at ${state?.crowdPercent ?? '?'}% — nearly empty`,
      `${timeCtx === 'evening' ? 'Golden hour river views right now' : 'Fresh breeze, great for a walk'}`,
      'Completely free — no entry fees',
      `Noise level: ${state?.noiseLevel ?? 'quiet'} — perfect for unwinding`,
    ],
    'rooftop-lounge': [
      `${state?.crowdPercent ?? '?'}% crowd — great vibe right now`,
      `${timeCtx === 'evening' ? '🌅 Sunset views from the rooftop' : 'Stylish space with city views'}`,
      `Score: ${state?.experienceScore ?? '?'}/100`,
      `~${state?.queueMinutes ?? 0} min wait — book your spot`,
    ],
  };

  const reasons = reasonsMap[best.place.id] ?? reasonsMap['central-park'];

  return (
    <AIHeroCard
      placeName={best.place.name}
      reasonBullets={reasons}
      etaMinutes={Math.ceil(best.place.distanceM / 80)}
      crowdPercent={state?.crowdPercent}
      experienceScore={state?.experienceScore}
      actions={{
        primary: { label: 'View Details', onClick: () => router.push(`/place/${best.place.id}`) },
        secondary: { label: 'Plan Trip', onClick: () => router.push('/chat') },
      }}
    />
  );
}

// ─── Quick Insights row ───────────────────────────────────────────────────────

function QuickInsights() {
  const router = useRouter();
  const state0 = usePlaceState(MOCK_PLACES[0].id).data;
  const state1 = usePlaceState(MOCK_PLACES[1].id).data;
  const state2 = usePlaceState(MOCK_PLACES[2].id).data;
  const state3 = usePlaceState(MOCK_PLACES[3].id).data;
  const state4 = usePlaceState(MOCK_PLACES[4].id).data;

  const states = [
    { place: MOCK_PLACES[0], data: state0 },
    { place: MOCK_PLACES[1], data: state1 },
    { place: MOCK_PLACES[2], data: state2 },
    { place: MOCK_PLACES[3], data: state3 },
    { place: MOCK_PLACES[4], data: state4 },
  ];

  const quietest = states.reduce((prev, cur) =>
    (cur.data?.crowdPercent ?? 100) < (prev.data?.crowdPercent ?? 100) ? cur : prev
  );

  const bestScore = states.reduce((prev, cur) =>
    (cur.data?.experienceScore ?? 0) > (prev.data?.experienceScore ?? 0) ? cur : prev
  );

  const insights = [
    {
      icon: '🤫',
      label: 'Quietest now',
      value: quietest.place.name,
      sub: `${quietest.data?.crowdPercent ?? '?'}% crowd`,
      color: 'var(--color-status-good)',
      href: `/place/${quietest.place.id}`,
      id: 'insight-quietest',
    },
    {
      icon: '⭐',
      label: 'Best experience',
      value: bestScore.place.name,
      sub: `${bestScore.data?.experienceScore ?? '?'}/100`,
      color: 'var(--color-status-mid)',
      href: `/place/${bestScore.place.id}`,
      id: 'insight-best',
    },
    {
      icon: '📈',
      label: 'Peak forecast',
      value: '7 PM spike',
      sub: 'Avoid evening rush',
      color: 'var(--color-status-bad)',
      href: `/forecast/${MOCK_PLACES[0].id}`,
      id: 'insight-peak',
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
      {insights.map((ins, i) => (
        <motion.button
          key={ins.id}
          id={ins.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          onClick={() => router.push(ins.href)}
          className="glass-card"
          style={{
            flexShrink: 0,
            width: 140,
            padding: '12px',
            textAlign: 'left',
            cursor: 'pointer',
            border: 'none',
            borderLeft: `3px solid ${ins.color}`,
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          aria-label={`${ins.label}: ${ins.value}`}
        >
          <div style={{ fontSize: '1.2rem', marginBottom: 6 }} aria-hidden="true">{ins.icon}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            {ins.label}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2, lineHeight: 1.2 }}>
            {ins.value}
          </div>
          <div style={{ fontSize: '0.65rem', color: ins.color, fontWeight: 600 }}>
            {ins.sub}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      id="theme-toggle"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-surface-border)',
        borderRadius: 12,
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '0.72rem',
        color: 'var(--color-text-secondary)',
        transition: 'all 0.2s ease',
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

// ─── Smart Alert ─────────────────────────────────────────────────────────────

function SmartAlert() {
  const { alertDismissed, dismissAlert } = useAppStore();
  const { data: spiceState } = usePlaceState('spice-market');
  const { data: artState } = usePlaceState('art-district');
  const router = useRouter();

  const showAlert = !alertDismissed && (spiceState?.crowdPercent ?? 0) > 65;

  return (
    <AlertBanner
      visible={showAlert}
      message="Spice Market is getting crowded — Art District is much quieter"
      comparison={{
        oldOption: 'Spice Market',
        oldStat: `${spiceState?.crowdPercent ?? 0}% full`,
        newOption: 'Art District',
        newStat: `${artState?.crowdPercent ?? 0}% full`,
      }}
      onDismiss={dismissAlert}
      onAction={() => router.push('/place/art-district')}
      actionLabel="Switch"
    />
  );
}

// ─── Main Home Page ───────────────────────────────────────────────────────────

export default function HomePage() {
  const { simOffsetMinutes } = useSimClock();
  const simHour = ((new Date().getHours() * 60 + new Date().getMinutes() + simOffsetMinutes) % (24 * 60)) / 60;
  const greeting =
    simHour < 5 ? 'Good night' :
    simHour < 12 ? 'Good morning' :
    simHour < 17 ? 'Good afternoon' : 'Good evening';

  const nearbyPlaces = MOCK_PLACES.slice(0, 6);

  return (
    <div className="page-container">
      {/* ── Sticky header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 52 }}>
          <div>
            <motion.p
              key={greeting}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}
            >
              {greeting} 👋
            </motion.p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              <span className="gradient-text">NEXUS</span>{' '}
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: '0.9rem' }}>
                City Intel
              </span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ThemeToggle />
            <LiveTicker />
          </div>
        </div>
      </div>

      {/* ── Alert ── */}
      <SmartAlert />

      {/* ── City Status ── */}
      <section aria-label="City status">
        <CityStatusBar />
      </section>

      {/* ── AI Hero ── */}
      <section aria-label="AI recommendation" style={{ marginBottom: 20 }}>
        <SmartHero />
      </section>

      {/* ── Quick Insights ── */}
      <section aria-label="Smart insights">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Smart Insights</h2>
          <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>
            <Zap size={8} aria-hidden="true" />
            AI-powered
          </span>
        </div>
        <QuickInsights />
      </section>

      {/* ── Nearby places ── */}
      <section aria-label="Nearby places">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Nearby Now</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--color-status-good)',
              display: 'inline-block',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }} aria-hidden="true" />
            <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>Live · 15s refresh</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nearbyPlaces.map((place, i) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <PlaceLiveCard
                placeId={place.id}
                name={place.name}
                category={place.category}
                distanceM={place.distanceM}
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
