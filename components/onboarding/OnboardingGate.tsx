'use client';
/**
 * OnboardingGate — shows a 2-screen first-run flow the first time a user
 * visits NEXUS, then never again. Existing users (preference state already
 * populated) skip straight to content.
 *
 * Why a gate (not a separate route)? The brief asks: "a brand-new user lands
 * straight into a dense data dashboard with no explanation of what NEXUS does
 * or why they should trust the numbers." A gate lets us explain the product
 * without routing the user away from Home, and persists via Zustand so we
 * don't repeat it on refresh.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Bell, ChevronRight, MapPin, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';

const ONBOARDING_KEY = 'nexus-onboarded';

function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return true; // SSR — skip gate
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return true;
  }
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const userPreferences = useAppStore((s) => s.userPreferences);
  const setUserPreferences = useAppStore((s) => s.setUserPreferences);

  useEffect(() => {
    if (hasCompletedOnboarding()) return;
    // Wait one frame so we don't fight React hydration.
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function complete() {
    try { window.localStorage.setItem(ONBOARDING_KEY, '1'); } catch {}
    setShow(false);
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            key="onboarding"
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to NEXUS"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 300,
              background: 'var(--ink)',
              backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(242,184,75,0.12) 0%, transparent 60%)',
              display: 'flex',
              flexDirection: 'column',
              padding: '4rem 1.5rem 2rem',
            }}
          >
            {step === 0 ? (
              <Step1 onNext={() => setStep(1)} onSkip={complete} />
            ) : (
              <Step2
                initialMood={userPreferences.mood}
                initialBudget={userPreferences.budgetRange[1]}
                onDone={(mood, budget) => {
                  setUserPreferences({
                    mood,
                    budgetRange: [100, budget],
                  });
                  complete();
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Step 1: What NEXUS is ──────────────────────────────────────────────────

function Step1({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const points = [
    { Icon: MapPin,   text: 'Live crowd levels for nearby spots, updated every 15 seconds.' },
    { Icon: Sparkles, text: 'AI-powered trip planning that respects your mood, budget, and time.' },
    { Icon: TrendingUp, text: '12-hour forecasts so you know when to go — not just where.' },
    { Icon: Shield,   text: 'Numbers come from live data sources and behave honestly when they don\'t.' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, maxWidth: 520, marginInline: 'auto', width: '100%' }}
    >
      <div>
        <span className="badge badge-accent">Welcome</span>
      </div>
      <h1 className="text-hero" style={{ marginTop: '0.5rem' }}>
        <span className="gradient-text">NEXUS</span>
      </h1>
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        What&apos;s the smartest thing to do right now, near you?
      </p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '1rem' }}>
        {points.map(({ Icon, text }, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}
          >
            <span style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: 'var(--beacon)',
            }}>
              <Icon size={16} aria-hidden="true" />
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5, paddingTop: 8 }}>
              {text}
            </span>
          </motion.li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onSkip}
          className="btn-secondary"
          style={{ flex: 1 }}
          aria-label="Skip onboarding"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          className="btn-primary"
          style={{ flex: 2 }}
        >
          Get started
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Pick your preferences ──────────────────────────────────────────

const MOOD_OPTIONS = [
  { id: 'peaceful', label: 'Peaceful' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'social',   label: 'Social' },
  { id: 'budget',   label: 'Budget' },
  { id: 'luxury',   label: 'Luxury' },
];

function Step2({
  initialMood,
  initialBudget,
  onDone,
}: {
  initialMood: string[];
  initialBudget: number;
  onDone: (mood: string[], budgetMax: number) => void;
}) {
  const [mood, setMood] = useState<string[]>(initialMood.length ? initialMood : ['peaceful']);
  const [budget, setBudget] = useState(initialBudget);

  function toggle(id: string) {
    setMood((cur) => cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, maxWidth: 520, marginInline: 'auto', width: '100%' }}
    >
      <span className="badge badge-accent">
        <Bell size={11} aria-hidden="true" />
        Personalize
      </span>
      <h2 className="text-hero" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
        What kind of day?
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Pick a vibe or two. You can change these any time in Profile.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {MOOD_OPTIONS.map((m) => {
          const active = mood.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              aria-pressed={active}
              className={active ? 'badge badge-accent' : 'badge'}
              style={{
                cursor: 'pointer',
                padding: '0.5rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: active ? 700 : 500,
                background: active ? 'var(--beacon-dim)' : 'var(--surface)',
                border: `1px solid ${active ? 'var(--beacon-border)' : 'var(--hairline)'}`,
                color: active ? 'var(--beacon)' : 'var(--text-secondary)',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span className="text-label">Max budget</span>
          <span className="text-mono" style={{ color: 'var(--beacon)', fontWeight: 700, fontSize: '0.9375rem' }}>
            ₹{budget.toLocaleString('en-IN')}
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={10000}
          step={100}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          aria-label="Maximum budget"
          style={{ width: '100%', accentColor: 'var(--beacon)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          <span>₹100</span>
          <span>₹10,000</span>
        </div>
      </div>

      <button
        onClick={() => onDone(mood, budget)}
        className="btn-primary"
        style={{ marginTop: 'auto' }}
      >
        Show me my city
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </motion.div>
  );
}