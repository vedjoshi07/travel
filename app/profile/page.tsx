'use client';
import { motion } from 'framer-motion';
import { User, Settings, MapPin, Heart, Zap, ChevronRight, Wallet, Footprints, Camera } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';

const MOOD_OPTIONS = ['peaceful', 'romantic', 'adventure', 'cultural', 'quick', 'social', 'budget', 'luxury'];
const WALKING_OPTIONS: { key: 'low' | 'med' | 'high'; label: string; desc: string }[] = [
  { key: 'low', label: '🚗 Low', desc: 'Prefer rides' },
  { key: 'med', label: '🚶 Medium', desc: 'Up to 1km' },
  { key: 'high', label: '🏃 High', desc: 'Love walking' },
];

export default function ProfilePage() {
  const { userPreferences, setUserPreferences, theme, toggleTheme } = useAppStore();
  const router = useRouter();

  function toggleMood(mood: string) {
    const current = userPreferences.mood;
    const next = current.includes(mood)
      ? current.filter((m) => m !== mood)
      : [...current, mood];
    setUserPreferences({ mood: next });
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--color-accent), #6A4CE8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={20} color="white" aria-hidden="true" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Travel Profile</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Your NEXUS preferences</p>
          </div>
        </div>
      </div>

      {/* Mood section */}
      <section aria-label="Travel mood preferences" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Heart size={14} color="var(--color-accent-glow)" aria-hidden="true" />
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Your Travel Mood</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MOOD_OPTIONS.map((mood) => {
            const active = userPreferences.mood.includes(mood);
            return (
              <motion.button
                key={mood}
                onClick={() => toggleMood(mood)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-pressed={active}
                id={`mood-${mood}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 100,
                  border: `1px solid ${active ? 'rgba(123,92,250,0.5)' : 'var(--color-surface-border)'}`,
                  background: active ? 'rgba(123,92,250,0.15)' : 'var(--color-surface)',
                  color: active ? 'var(--color-accent-glow)' : 'var(--color-text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize',
                }}
              >
                {mood}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Budget section */}
      <section aria-label="Budget range" style={{ marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Wallet size={14} color="var(--color-accent-glow)" aria-hidden="true" />
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Budget Range</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Min</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              ₹{userPreferences.budgetRange[0].toLocaleString('en-IN')} – ₹{userPreferences.budgetRange[1].toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Max</span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={userPreferences.budgetRange[1]}
            onChange={(e) => setUserPreferences({ budgetRange: [userPreferences.budgetRange[0], +e.target.value] })}
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            aria-label="Maximum budget"
            id="budget-slider"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            <span>₹100</span><span>₹10,000</span>
          </div>
        </div>
      </section>

      {/* Walking comfort */}
      <section aria-label="Walking comfort preference" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Footprints size={14} color="var(--color-accent-glow)" aria-hidden="true" />
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Walking Comfort</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {WALKING_OPTIONS.map((opt) => {
            const active = userPreferences.walkingComfort === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setUserPreferences({ walkingComfort: opt.key })}
                id={`walking-${opt.key}`}
                aria-pressed={active}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 14,
                  border: `1px solid ${active ? 'rgba(123,92,250,0.5)' : 'var(--color-surface-border)'}`,
                  background: active ? 'rgba(123,92,250,0.12)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.85rem', marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Settings links */}
      <section aria-label="App settings" style={{ marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {[
            {
              icon: <Settings size={14} aria-hidden="true" />,
              label: 'Theme',
              value: theme === 'dark' ? '🌙 Dark' : '☀️ Light',
              id: 'profile-theme-btn',
              onClick: toggleTheme,
            },
            {
              icon: <MapPin size={14} aria-hidden="true" />,
              label: 'Explore Map',
              value: 'View intelligence layers →',
              id: 'profile-map-btn',
              onClick: () => router.push('/map'),
            },
            {
              icon: <Zap size={14} aria-hidden="true" />,
              label: 'AI Planner',
              value: 'Create a new itinerary →',
              id: 'profile-ai-btn',
              onClick: () => router.push('/chat'),
            },
            {
              icon: <Camera size={14} aria-hidden="true" />,
              label: 'Image Search',
              value: 'Search Pexels photos →',
              id: 'profile-search-btn',
              onClick: () => router.push('/search'),
            },
          ].map((item, i, arr) => (
            <button
              key={item.id}
              id={item.id}
              onClick={item.onClick}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                background: 'none',
                border: 'none',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-surface-border)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-primary)' }}>
                <span style={{ color: 'var(--color-accent-glow)' }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.value}</span>
                <ChevronRight size={14} color="var(--color-text-muted)" aria-hidden="true" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Phase 5 stub */}
      <div className="glass-card" style={{ padding: '16px', textAlign: 'center', opacity: 0.5 }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
          🚧 Coming in Phase 5
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          Travel Memories · AI Time Machine · Mood Detection
        </p>
      </div>
    </div>
  );
}
