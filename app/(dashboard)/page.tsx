'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { Sparkles, Compass } from 'lucide-react';
import { useCityState } from '@/lib/hooks/use-city-state';
import { usePlaceState } from '@/lib/hooks/use-place-state';
import { useSimClock } from '@/lib/simulation/sim-clock-context';
import { MOCK_PLACES } from '@/lib/simulation/engine';
import type { PlaceSimState } from '@/lib/simulation/engine';
import { AIHeroCard } from '@/components/ai-hero-card/AIHeroCard';
import { AlertBanner } from '@/components/alert-banner/AlertBanner';
import { PlaceLiveCard } from '@/components/place-live-card/PlaceLiveCard';
import { MiniMapHero } from '@/components/mini-map-hero/MiniMapHero';
import { buildInsights } from '@/lib/insights';
import { decideAlert } from '@/lib/alerts';
import { formatTime } from '@/lib/locale';
import { useAppStore } from '@/lib/store/app-store';

// ─── Live header clock ──────────────────────────────────────────────────────

function LiveClock() {
  const { simOffsetMinutes } = useSimClock();
  const locale = useAppStore((s) => s.locale);
  // useSyncExternalStore keeps the SSR-safe "now" snapshot outside the
  // effect lifecycle and avoids the React 19 setState-in-effect warning.
  const tick = useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, 1000);
      return () => clearInterval(id);
    },
    () => new Date(),
    () => null,
  );

  if (!tick) return <span className="text-mono" aria-hidden="true">--:--</span>;

  const display = new Date(tick.getTime() + simOffsetMinutes * 60_000);
  const isSimulated = simOffsetMinutes !== 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} aria-live="polite" aria-atomic="true">
      {isSimulated && (
        <span className="badge badge-accent" style={{ fontSize: '0.625rem' }}>SIM</span>
      )}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
      }}>
        <span className="nexus-ring__live" aria-hidden="true" style={{ position: 'static' }} />
        <span className="text-mono">{formatTime(display, locale, { seconds: true })}</span>
      </span>
    </div>
  );
}

// ─── City status — collapsed into a single quiet line under the hero ───────

function CityStatusLine() {
  const { data: city } = useCityState();

  if (!city) {
    return <div style={{ height: 28, borderRadius: 8, background: 'var(--surface)' }} aria-hidden="true" />;
  }

  const trafficColor =
    city.trafficLevel === 'low' ? 'var(--status-good)' :
    city.trafficLevel === 'medium' ? 'var(--status-mid)' :
    'var(--status-bad)';

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.75rem 1.25rem',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      background: 'var(--surface)',
      border: '1px solid var(--hairline)',
      borderRadius: 14,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden="true">{city.weatherIcon}</span>
        <span className="text-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{city.weatherC}°C</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{city.weatherLabel}</span>
      </span>
      <span style={{ width: 1, height: 16, background: 'var(--hairline)' }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: trafficColor }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{city.trafficLevel} traffic</span>
      </span>
      <span style={{ width: 1, height: 16, background: 'var(--hairline)' }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Compass size={11} color="var(--signal)" aria-hidden="true" />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{city.activeEvents} live events</span>
      </span>
      <span style={{ marginInlineStart: 'auto', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
        AQI: <span className="text-mono" style={{ color: 'var(--text-primary)' }}>{city.airQuality}</span>
      </span>
    </div>
  );
}

// ─── Smart Alert — uses the alerts invariant module ─────────────────────────

function SmartAlert() {
  const { alertDismissed, dismissAlert } = useAppStore();
  const router = useRouter();

  // The home-page hero is "Spice Market" today. Look up its state and the
  // state of every other place, then let the alerts module decide.
  const states = useAllPlaceStates();

  const decision = decideAlert({
    states,
    currentPlaceId: 'spice-market',
  });

  if (alertDismissed || !decision.visible) return null;

  const current = states['spice-market'];
  const alt = decision.alternativePlaceId ? MOCK_PLACES.find((p) => p.id === decision.alternativePlaceId) : undefined;
  const altState = decision.alternativePlaceId ? states[decision.alternativePlaceId] : undefined;

  if (!current || !alt || !altState) return null;

  return (
    <AlertBanner
      visible={true}
      message={`Spice Market is getting crowded — ${alt.name} is calmer right now.`}
      comparison={{
        oldOption: 'Spice Market',
        oldStat: `${current.crowdPercent}% full`,
        newOption: alt.name,
        newStat: `${altState.crowdPercent}% full`,
      }}
      onDismiss={dismissAlert}
      onAction={() => router.push(`/place/${alt.id}`)}
      actionLabel="Switch"
    />
  );
}

// ─── Hook to read all place states once (used by insights + alert) ─────────

function useAllPlaceStates(): Partial<Record<string, PlaceSimState>> {
  const s0 = usePlaceState(MOCK_PLACES[0].id).data;
  const s1 = usePlaceState(MOCK_PLACES[1].id).data;
  const s2 = usePlaceState(MOCK_PLACES[2].id).data;
  const s3 = usePlaceState(MOCK_PLACES[3].id).data;
  const s4 = usePlaceState(MOCK_PLACES[4].id).data;
  const s5 = usePlaceState(MOCK_PLACES[5].id).data;
  const s6 = usePlaceState(MOCK_PLACES[6].id).data;
  const s7 = usePlaceState(MOCK_PLACES[7].id).data;
  const s8 = usePlaceState(MOCK_PLACES[8].id).data;
  const s9 = usePlaceState(MOCK_PLACES[9].id).data;
  const s10 = usePlaceState(MOCK_PLACES[10].id).data;
  const s11 = usePlaceState(MOCK_PLACES[11].id).data;

  return {
    'central-park': s0,
    'lotus-cafe': s1,
    'riverside-walk': s2,
    'art-district': s3,
    'spice-market': s4,
    'rooftop-lounge': s5,
    'heritage-quarter': s6,
    'night-bazaar': s7,
    'baga-beach': s8,
    'calangute-beach': s9,
    'fort-aguada': s10,
    'anjuna-market': s11,
  };
}

// ─── AI Hero ───────────────────────────────────────────────────────────────

function SmartHero() {
  const router = useRouter();

  // Hooks at the top level — never call a hook inside a callback.
  const sCentral = usePlaceState('central-park');
  const sLotus   = usePlaceState('lotus-cafe');
  const sRiver   = usePlaceState('riverside-walk');
  const sRoof    = usePlaceState('rooftop-lounge');

  const states = [sCentral, sLotus, sRiver, sRoof];
  const ids: Array<'central-park' | 'lotus-cafe' | 'riverside-walk' | 'rooftop-lounge'> = [
    'central-park', 'lotus-cafe', 'riverside-walk', 'rooftop-lounge',
  ];

  const anyLoading = states.some((s) => s.isLoading);
  const allLoaded = states.every((s) => !s.isLoading && s.data);

  if (anyLoading || !allLoaded) {
    return (
      <div className="card-accent" style={{ padding: 20 }} role="region" aria-label="AI recommendation — loading" aria-busy="true">
        <div className="badge badge-accent" style={{ marginBottom: 12 }}>
          <Sparkles size={10} aria-hidden="true" />
          AI Recommendation
        </div>
        <div style={{
          height: 28, width: '60%', borderRadius: 8,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s ease-in-out infinite',
          marginBottom: 14,
        }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              height: 22, width: 76, borderRadius: 100,
              background: 'rgba(255,255,255,0.05)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 12, width: `${85 - i * 6}%`, borderRadius: 4,
              background: 'rgba(255,255,255,0.04)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      </div>
    );
  }

  // Pick the best by experience score, tie-broken by lower crowd.
  let best = states[0];
  for (const s of states) {
    const a = s.data!;
    const b = best.data!;
    if (a.experienceScore > b.experienceScore ||
        (a.experienceScore === b.experienceScore && a.crowdPercent < b.crowdPercent)) {
      best = s;
    }
  }
  const id = ids[states.indexOf(best)];
  const place = MOCK_PLACES.find((p) => p.id === id)!;
  const data = best.data!;

  const reasonsMap: Record<string, string[]> = {
    'central-park': [
      `Only ${data.crowdPercent}% crowd — open and breezy right now`,
      'Perfect for a midday walk or a quiet reset',
      `Score: ${data.experienceScore}/100 — top pick this hour`,
      data.queueMinutes === 0 ? 'Walk right in, no queue' : `~${data.queueMinutes} min queue`,
    ],
    'lotus-cafe': [
      `Just ${data.crowdPercent}% full — grab your spot now`,
      'Cozy and calm for a working break or slow coffee',
      `Score: ${data.experienceScore}/100 — highest nearby`,
      `~${data.queueMinutes ?? 0} min wait — get in before it fills up`,
    ],
    'riverside-walk': [
      `Peaceful at ${data.crowdPercent}% — nearly empty`,
      'Fresh breeze, great for a walk',
      'Completely free — no entry fees',
      `Noise level: ${data.noiseLevel} — perfect for unwinding`,
    ],
    'rooftop-lounge': [
      `${data.crowdPercent}% crowd — great vibe right now`,
      'Stylish space with sunset views',
      `Score: ${data.experienceScore}/100`,
      `~${data.queueMinutes ?? 0} min wait — book your spot`,
    ],
  };

  return (
    <AIHeroCard
      placeName={place.name}
      reasonBullets={reasonsMap[id] ?? []}
      etaMinutes={Math.ceil(place.distanceM / 80)}
      crowdPercent={data.crowdPercent}
      experienceScore={data.experienceScore}
      imageUrl={place.imageUrl}
      category={place.category}
      actions={{
        primary: { label: 'View Details', onClick: () => router.push(`/place/${id}`) },
        secondary: { label: 'Plan Trip', onClick: () => router.push('/chat') },
      }}
    />
  );
}

// ─── Smart Insights — built by the insights module (3 distinct entities) ───

function QuickInsights() {
  const router = useRouter();
  const { simOffsetMinutes } = useSimClock();
  const states = useAllPlaceStates();

  const slots = buildInsights({ states, simOffsetMinutes });

  return (
    <div className="grid-3" role="list" aria-label="Smart insights">
      {slots.map((slot, i) => (
        <motion.button
          key={slot.kind}
          role="listitem"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => router.push(slot.kind === 'peak' ? `/forecast/${slot.placeId}` : `/place/${slot.placeId}`)}
          className="insight-slot"
          data-tone={slot.tone}
          aria-label={`${slot.kind === 'quietest' ? 'Quietest now' : slot.kind === 'best' ? 'Best experience' : 'Peak forecast'}: ${slot.value}. ${slot.sub}.`}
        >
          <span className="text-label">{labelForKind(slot.kind)}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {slot.value}
          </span>
          <span className="text-mono" style={{
            color: slot.tone === 'signal' ? 'var(--signal)' : slot.tone === 'beacon' ? 'var(--beacon)' : 'var(--alert)',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}>
            {slot.sub}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function labelForKind(k: 'quietest' | 'best' | 'peak'): string {
  return k === 'quietest' ? 'Quietest now' : k === 'best' ? 'Best experience' : 'Peak forecast';
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { simOffsetMinutes } = useSimClock();
  const userPreferences = useAppStore((s) => s.userPreferences);

  const simMinutes =
    new Date().getHours() * 60 + new Date().getMinutes() + simOffsetMinutes;
  const simHour = ((simMinutes % (24 * 60)) + 24 * 60) / 60;
  const greeting =
    simHour < 5 ? 'Good night' :
    simHour < 12 ? 'Good morning' :
    simHour < 17 ? 'Good afternoon' : 'Good evening';

  const states = useAllPlaceStates();
  const nearbyPlaces = MOCK_PLACES.slice(0, 6);

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 52 }}>
          <div>
            <motion.p
              key={greeting}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}
            >
              {greeting}{userPreferences.mood.length > 0 ? ' — ' + userPreferences.mood[0] : ''}
            </motion.p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.625rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}>
              <span className="gradient-text">NEXUS</span>
            </h1>
          </div>
          <LiveClock />
        </div>
      </div>

      <SmartAlert />

      <section aria-label="Live map of nearby places" style={{ marginBottom: 20 }}>
        <MiniMapHero states={states} />
      </section>

      <section aria-label="City status" style={{ marginBottom: 20 }}>
        <CityStatusLine />
      </section>

      <section aria-label="AI recommendation" style={{ marginBottom: 20 }}>
        <SmartHero />
      </section>

      <section aria-label="Smart insights" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Smart Insights</h2>
          <span className="badge badge-accent" style={{ fontSize: '0.625rem' }}>
            <Sparkles size={10} aria-hidden="true" />
            AI
          </span>
        </div>
        <QuickInsights />
      </section>

      <section aria-label="Nearby now">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Nearby Now</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="nexus-ring__live" aria-hidden="true" style={{ position: 'static' }} />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Live · 15s refresh</span>
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
                imageUrl={place.imageUrl}
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}