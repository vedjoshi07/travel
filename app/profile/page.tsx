'use client';
/**
 * Profile / Travel preferences
 *
 * - Mood chips, budget slider, walking comfort (existing model kept)
 * - Working light/dark toggle (the old "Theme: 🌙 Dark" link was a label, not a toggle)
 * - Locale controls: currency (₹ / $ / € / £), distance unit (km / mi), 12/24h time
 * - All currency/distance/time formatting goes through `lib/locale`, never hardcoded
 */
import { motion } from 'framer-motion';
import {
  User, Settings, Heart, ChevronRight, Wallet,
  Footprints, Moon, Sun, Globe, Clock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/locale';
import type { CurrencyCode, DistanceUnit } from '@/lib/locale';

const MOOD_OPTIONS = [
  'peaceful', 'romantic', 'cultural', 'social', 'budget', 'luxury', 'adventure', 'quick',
];

const WALKING_OPTIONS: { key: 'low' | 'med' | 'high'; label: string; desc: string }[] = [
  { key: 'low',  label: '🚗 Low',  desc: 'Prefer rides' },
  { key: 'med',  label: '🚶 Med',  desc: 'Up to 1 km' },
  { key: 'high', label: '🏃 High', desc: 'Love walking' },
];

const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'INR', label: 'Indian Rupee',  symbol: '₹' },
  { code: 'USD', label: 'US Dollar',     symbol: '$' },
  { code: 'EUR', label: 'Euro',          symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
];

const LOCALE_OPTIONS = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'hi-IN', label: 'हिन्दी' },
] as const;

export default function ProfilePage() {
  const {
    userPreferences, setUserPreferences,
    theme, toggleTheme,
    locale, setLocale,
  } = useAppStore();
  const router = useRouter();

  function toggleMood(mood: string) {
    const next = userPreferences.mood.includes(mood)
      ? userPreferences.mood.filter((m) => m !== mood)
      : [...userPreferences.mood, mood];
    setUserPreferences({ mood: next });
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'var(--beacon)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(242, 184, 75, 0.3)',
          }}>
            <User size={20} color="#1A1300" aria-hidden="true" />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}>
              Travel Profile
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Your NEXUS preferences</p>
          </div>
        </div>
      </div>

      {/* Mood */}
      <section aria-label="Travel mood preferences" style={{ marginBottom: 20 }}>
        <SectionHeading icon={<Heart size={14} aria-hidden="true" />} title="Your Travel Mood" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MOOD_OPTIONS.map((mood) => {
            const active = userPreferences.mood.includes(mood);
            return (
              <motion.button
                key={mood}
                onClick={() => toggleMood(mood)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                aria-pressed={active}
                id={`mood-${mood}`}
                className={active ? 'chip' : 'badge'}
                data-tone={active ? 'beacon' : undefined}
                style={{
                  cursor: 'pointer',
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: active ? 700 : 500,
                  minHeight: 44,
                }}
              >
                {mood}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Budget */}
      <section aria-label="Budget range" style={{ marginBottom: 20 }}>
        <SectionHeading icon={<Wallet size={14} aria-hidden="true" />} title="Budget Range" />
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Max</span>
            <span className="text-mono" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              {formatCurrency(userPreferences.budgetRange[1], locale)}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={userPreferences.budgetRange[1]}
            onChange={(e) => setUserPreferences({
              budgetRange: [userPreferences.budgetRange[0], Number(e.target.value)],
            })}
            style={{ width: '100%', accentColor: 'var(--beacon)' }}
            aria-label="Maximum budget per plan"
            aria-valuemin={100}
            aria-valuemax={10000}
            aria-valuenow={userPreferences.budgetRange[1]}
            id="budget-slider"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            <span>{formatCurrency(100, locale)}</span>
            <span>{formatCurrency(10000, locale)}</span>
          </div>
        </div>
      </section>

      {/* Walking comfort */}
      <section aria-label="Walking comfort preference" style={{ marginBottom: 20 }}>
        <SectionHeading icon={<Footprints size={14} aria-hidden="true" />} title="Walking Comfort" />
        <div style={{ display: 'flex', gap: 8 }}>
          {WALKING_OPTIONS.map((opt) => {
            const active = userPreferences.walkingComfort === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setUserPreferences({ walkingComfort: opt.key })}
                id={`walking-${opt.key}`}
                aria-pressed={active}
                className={active ? 'card-accent' : 'card'}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: active ? 'var(--surface)' : 'var(--surface)',
                  minHeight: 64,
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  marginBottom: 2,
                  color: active ? 'var(--beacon)' : 'var(--text-primary)',
                }}>{opt.label}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Appearance — real working toggle */}
      <section aria-label="Appearance" style={{ marginBottom: 20 }}>
        <SectionHeading icon={theme === 'dark' ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />} title="Appearance" />
        <div className="card" style={{ padding: 4, display: 'flex', gap: 4 }}>
          <ThemeOption current={theme} value="dark"  label="Dark"  Icon={Moon} onClick={() => theme !== 'dark' && toggleTheme()} />
          <ThemeOption current={theme} value="light" label="Light" Icon={Sun}  onClick={() => theme !== 'light' && toggleTheme()} />
        </div>
      </section>

      {/* Locale */}
      <section aria-label="Locale preferences" style={{ marginBottom: 20 }}>
        <SectionHeading icon={<Globe size={14} aria-hidden="true" />} title="Language & Region" />
        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Language">
            <select
              value={locale.locale}
              onChange={(e) => setLocale({ locale: e.target.value as typeof locale.locale })}
              aria-label="Language"
              style={selectStyle}
            >
              {LOCALE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Currency">
            <select
              value={locale.currency}
              onChange={(e) => setLocale({ currency: e.target.value as CurrencyCode })}
              aria-label="Currency"
              style={selectStyle}
            >
              {CURRENCY_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>{o.symbol} — {o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Distance">
            <div style={{ display: 'flex', gap: 6 }}>
              {(['km', 'mi'] as DistanceUnit[]).map((u) => {
                const active = locale.distanceUnit === u;
                return (
                  <button
                    key={u}
                    onClick={() => setLocale({ distanceUnit: u })}
                    aria-pressed={active}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, minHeight: 44,
                      background: active ? 'var(--beacon-dim)' : 'var(--surface)',
                      border: `1px solid ${active ? 'var(--beacon-border)' : 'var(--hairline)'}`,
                      color: active ? 'var(--beacon)' : 'var(--text-secondary)',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {u === 'km' ? 'Kilometres' : 'Miles'}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Time format">
            <div style={{ display: 'flex', gap: 6 }}>
              {([true, false] as const).map((h12) => {
                const active = locale.hour12 === h12;
                return (
                  <button
                    key={String(h12)}
                    onClick={() => setLocale({ hour12: h12 })}
                    aria-pressed={active}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, minHeight: 44,
                      background: active ? 'var(--beacon-dim)' : 'var(--surface)',
                      border: `1px solid ${active ? 'var(--beacon-border)' : 'var(--hairline)'}`,
                      color: active ? 'var(--beacon)' : 'var(--text-secondary)',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={12} aria-hidden="true" />
                    {h12 ? '12-hour' : '24-hour'}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </section>

      {/* Quick links */}
      <section aria-label="App settings" style={{ marginBottom: 20 }}>
        <SectionHeading icon={<Settings size={14} aria-hidden="true" />} title="Quick links" />
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <SettingsRow
            id="profile-map-btn"
            label="Intelligence Map"
            value="Layers & heatmap →"
            onClick={() => router.push('/map')}
          />
          <SettingsRow
            id="profile-ai-btn"
            label="AI Planner"
            value="New itinerary →"
            onClick={() => router.push('/chat')}
          />
          <SettingsRow
            id="profile-search-btn"
            label="Image Search"
            value="Search Pexels photos →"
            onClick={() => router.push('/search')}
          />
        </div>
      </section>

      {/* Phase 5 stub — keep this retention hook */}
      <div className="card" style={{ padding: 16, textAlign: 'center', opacity: 0.6, marginBottom: 8 }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          🚧 Coming in Phase 5
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Travel Memories · AI Time Machine · Mood Detection
        </p>
      </div>
    </div>
  );
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
    }}>
      <span style={{ color: 'var(--beacon)' }}>{icon}</span>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function ThemeOption({
  current, value, label, Icon, onClick,
}: {
  current: 'dark' | 'light';
  value: 'dark' | 'light';
  label: string;
  Icon: typeof Moon;
  onClick: () => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      id={`theme-${value}`}
      style={{
        flex: 1,
        padding: '10px 14px',
        borderRadius: 10,
        background: active ? 'var(--beacon)' : 'transparent',
        color: active ? '#1A1300' : 'var(--text-secondary)',
        fontWeight: active ? 700 : 500,
        fontSize: '0.875rem',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 44,
      }}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </button>
  );
}

function SettingsRow({
  id, label, value, onClick,
}: {
  id: string; label: string; value: string; onClick: () => void;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--hairline)',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: 56,
      }}
    >
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{value}</span>
        <ChevronRight size={14} color="var(--text-muted)" aria-hidden="true" />
      </span>
    </button>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--surface-2)',
  border: '1px solid var(--hairline)',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  minHeight: 44,
  appearance: 'none',
  fontFamily: 'inherit',
};