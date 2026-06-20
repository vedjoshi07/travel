'use client';
/**
 * AlertBanner — shown when the current location is over-crowded and there's
 * a calmer alternative. The banner is reserved exclusively for this meaning,
 * per the new design system (the alert color is *only* ever used here).
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ChevronRight } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  comparison?: {
    oldOption: string;
    oldStat: string;
    newOption: string;
    newStat: string;
  };
  onDismiss: () => void;
  onAction?: () => void;
  actionLabel?: string;
  visible: boolean;
}

export function AlertBanner({
  message,
  comparison,
  onDismiss,
  onAction,
  actionLabel = 'Switch',
  visible,
}: AlertBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -20, scaleY: 0.8 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -20, scaleY: 0.8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--alert-dim)',
            border: '1px solid var(--alert-border)',
            borderRadius: 16,
            padding: '12px 14px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <AlertTriangle
            size={16}
            color="var(--alert)"
            style={{ flexShrink: 0, marginTop: 1 }}
            aria-hidden="true"
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>
              {message}
            </p>
            {comparison && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--alert)' }}>
                  {comparison.oldOption} ({comparison.oldStat})
                </span>
                <ChevronRight size={11} aria-hidden="true" />
                <span style={{ color: 'var(--signal)', fontWeight: 600 }}>
                  {comparison.newOption} ({comparison.newStat})
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {onAction && (
              <button
                onClick={onAction}
                id="alert-action-btn"
                className="btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderColor: 'var(--alert-border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  minHeight: 36,
                }}
                aria-label={actionLabel}
              >
                {actionLabel}
              </button>
            )}
            <button
              onClick={onDismiss}
              id="alert-dismiss-btn"
              className="btn-secondary"
              style={{
                padding: 6,
                minHeight: 36,
                minWidth: 36,
                borderColor: 'var(--hairline)',
                background: 'transparent',
              }}
              aria-label="Dismiss alert"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}