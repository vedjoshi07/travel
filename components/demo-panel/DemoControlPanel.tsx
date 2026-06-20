'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, ChevronUp, RotateCcw, FastForward } from 'lucide-react';
import { useSimClock } from '@/lib/simulation/sim-clock-context';
import { useNow } from '@/lib/hooks/use-now';

function formatSimTime(baseDate: Date, offsetMinutes: number): string {
  const simDate = new Date(baseDate.getTime() + offsetMinutes * 60_000);
  return simDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const TIME_PRESETS = [
  { label: 'Now',    offset: 0 },
  { label: '9 AM',  offset: null, hour: 9 },
  { label: '1 PM',  offset: null, hour: 13 },
  { label: '7 PM',  offset: null, hour: 19 },
  { label: '11 PM', offset: null, hour: 23 },
] as const;

export function DemoControlPanel() {
  const { simOffsetMinutes, setSimOffset, reset } = useSimClock();
  const [expanded, setExpanded] = useState(false);

  const now = useNow();
  const simTime = now ? formatSimTime(now, simOffsetMinutes) : '--:--';
  const isOffset = simOffsetMinutes !== 0;

  function setToHour(hour: number) {
    // Capture the wall-clock NOW inside the click handler — capturing it at
    // component-mount time goes stale as the user lingers on the page and
    // preset offsets drift by minutes.
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const diff = hour - currentHour;
    setSimOffset(diff * 60);
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
      }}
    >
      {/* Toggle button */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        id="demo-panel-toggle"
        aria-label="Toggle demo time controls"
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: isOffset
            ? 'linear-gradient(135deg, rgba(123,92,250,0.3), rgba(123,92,250,0.15))'
            : 'rgba(10, 14, 26, 0.8)',
          border: `1px solid ${isOffset ? 'rgba(123,92,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 100,
          backdropFilter: 'blur(16px)',
          cursor: 'pointer',
          color: isOffset ? 'var(--color-accent-glow)' : 'var(--color-text-secondary)',
          fontSize: '0.72rem',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
      >
        <Clock size={11} aria-hidden="true" />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{simTime}</span>
        {isOffset && (
          <span style={{
            background: 'rgba(123,92,250,0.3)',
            borderRadius: 100,
            padding: '1px 5px',
            fontSize: '0.6rem',
          }}>
            SIM
          </span>
        )}
        {expanded ? <ChevronUp size={10} aria-hidden="true" /> : <ChevronDown size={10} aria-hidden="true" />}
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Demo time controls"
            style={{
              background: 'rgba(10, 14, 26, 0.92)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              backdropFilter: 'blur(24px)',
              padding: '14px',
              width: 210,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ⚡ Demo Time Control
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {TIME_PRESETS.map((p) => {
                const isActive = p.offset === 0
                  ? simOffsetMinutes === 0
                  : false;
                return (
                  <button
                    key={p.label}
                    onClick={() => {
                      if ('hour' in p && p.hour !== undefined) setToHour(p.hour);
                      else reset();
                    }}
                    id={`time-preset-${p.label.replace(/\s+/g, '-').toLowerCase()}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 100,
                      border: `1px solid ${isActive ? 'rgba(123,92,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      background: isActive ? 'rgba(123,92,250,0.2)' : 'rgba(255,255,255,0.04)',
                      color: isActive ? 'var(--color-accent-glow)' : 'var(--color-text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: isActive ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Slider */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                <span>Time of day</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-accent-glow)' }}>
                  {simTime}
                </span>
              </div>
              <input
                type="range"
                min={-720}
                max={720}
                value={simOffsetMinutes}
                onChange={(e) => setSimOffset(Number(e.target.value))}
                aria-label="Simulate time offset in minutes"
                id="sim-time-slider"
                style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                <span>-12h</span>
                <span>+12h</span>
              </div>
            </div>

            {/* Actions row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={reset}
                id="demo-reset-btn"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '7px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
                aria-label="Reset to real time"
              >
                <RotateCcw size={11} aria-hidden="true" />
                Reset
              </button>
              <button
                onClick={() => setSimOffset(simOffsetMinutes + 60)}
                id="demo-advance-btn"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '7px',
                  background: 'rgba(123,92,250,0.12)',
                  border: '1px solid rgba(123,92,250,0.25)',
                  borderRadius: 10,
                  color: 'var(--color-accent-glow)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                aria-label="Advance simulated time by 1 hour"
              >
                <FastForward size={11} aria-hidden="true" />
                +1h
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
