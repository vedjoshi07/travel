'use client';
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
          aria-live="assertive"
          initial={{ opacity: 0, y: -20, scaleY: 0.8 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -20, scaleY: 0.8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'linear-gradient(135deg, rgba(244, 196, 48, 0.12), rgba(231, 76, 60, 0.08))',
            border: '1px solid rgba(244, 196, 48, 0.25)',
            borderRadius: 16,
            padding: '12px 14px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          {/* Icon */}
          <AlertTriangle
            size={16}
            color="var(--color-status-mid)"
            style={{ flexShrink: 0, marginTop: 1 }}
            aria-hidden="true"
          />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: 4 }}>
              {message}
            </p>
            {comparison && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.72rem',
                color: 'var(--color-text-secondary)',
              }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--color-status-bad)' }}>
                  {comparison.oldOption} ({comparison.oldStat})
                </span>
                <ChevronRight size={10} aria-hidden="true" />
                <span style={{ color: 'var(--color-status-good)', fontWeight: 600 }}>
                  {comparison.newOption} ({comparison.newStat})
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {onAction && (
              <button
                onClick={onAction}
                id="alert-action-btn"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--color-accent-glow)',
                  background: 'none',
                  border: '1px solid rgba(123,92,250,0.3)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
                aria-label={actionLabel}
              >
                {actionLabel}
              </button>
            )}
            <button
              onClick={onDismiss}
              id="alert-dismiss-btn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-muted)',
                borderRadius: 6,
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
