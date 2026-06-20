'use client';
import { motion } from 'framer-motion';
import { Clock, MapPin, IndianRupee, CheckCircle2 } from 'lucide-react';
import type { TimelineStep } from '@/lib/itinerary/mock-itinerary';

interface TimelinePlannerProps {
  steps: TimelineStep[];
  totalCostInr: number;
  matchedPreferences: string[];
  summary?: string;
}

export function TimelinePlanner({ steps, totalCostInr, matchedPreferences, summary }: TimelinePlannerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Summary */}
      {summary && (
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--color-text-secondary)',
          marginBottom: 16,
          lineHeight: 1.6,
          padding: '10px 14px',
          background: 'rgba(123,92,250,0.06)',
          borderRadius: 12,
          borderLeft: '3px solid var(--color-accent)',
        }}>
          {summary}
        </p>
      )}

      {/* Preference badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {matchedPreferences.map((pref) => (
          <span key={pref} className="badge badge-good" style={{ fontSize: '0.68rem' }}>
            {pref}
          </span>
        ))}
      </div>

      {/* Timeline steps */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute',
          left: 20,
          top: 24,
          bottom: 24,
          width: 1,
          background: 'linear-gradient(to bottom, var(--color-accent), transparent)',
          opacity: 0.3,
        }} />

        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              gap: 14,
              marginBottom: i < steps.length - 1 ? 16 : 0,
            }}
          >
            {/* Timeline dot */}
            <div style={{
              width: 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                border: '2px solid var(--color-bg)',
                boxShadow: '0 0 8px rgba(123,92,250,0.4)',
                marginTop: 14,
              }} />
            </div>

            {/* Content card */}
            <div className="glass-card" style={{ flex: 1, padding: '12px 14px' }}>
              {/* Time */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.7rem',
                  color: 'var(--color-accent-glow)',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <Clock size={10} aria-hidden="true" />
                  {step.time}
                </span>
                {step.costInr !== undefined && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    fontSize: '0.7rem',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <IndianRupee size={10} aria-hidden="true" />
                    {step.costInr === 0 ? 'Free' : step.costInr.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: 4 }}>
                {step.title}
              </div>
              {step.subtitle && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: step.description ? 4 : 0 }}>
                  {step.subtitle}
                </div>
              )}
              {step.description && (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {step.description}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total cost footer */}
      <div className="glass-card" style={{
        padding: '12px 16px',
        marginTop: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={14} color="var(--color-status-good)" aria-hidden="true" />
          Total estimated cost
        </span>
        <span style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          fontVariantNumeric: 'tabular-nums',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <IndianRupee size={16} aria-hidden="true" />
          {totalCostInr.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
