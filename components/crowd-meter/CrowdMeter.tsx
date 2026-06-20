'use client';
import { motion } from 'framer-motion';

interface CrowdMeterProps {
  percent: number;
  size?: 'sm' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

function getCrowdInfo(percent: number): { label: string; color: string; icon: string } {
  if (percent < 35) return { label: 'Low', color: 'var(--color-status-good)', icon: '●' };
  if (percent < 70) return { label: 'Medium', color: 'var(--color-status-mid)', icon: '●' };
  return { label: 'High', color: 'var(--color-status-bad)', icon: '●' };
}

export function CrowdMeter({ percent, size = 'sm', showLabel = true, animated = true }: CrowdMeterProps) {
  const { label, color, icon } = getCrowdInfo(percent);
  const isLg = size === 'lg';

  const radius = isLg ? 36 : 22;
  const stroke = isLg ? 5 : 4;
  const cx = radius + stroke;
  const cy = radius + stroke;
  const svgSize = (radius + stroke) * 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isLg ? 12 : 8 }}>
      {/* Circular arc */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg
          width={svgSize}
          height={svgSize}
          role="img"
          aria-label={`Crowd level: ${percent}% — ${label}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke}
          />
          {/* Fill */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: dashOffset }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
          />
        </svg>
        {/* Center number */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isLg ? '1rem' : '0.6rem',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color,
        }}>
          {percent}
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div>
          <div style={{
            fontSize: isLg ? '0.875rem' : '0.7rem',
            fontWeight: 600,
            color,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span aria-hidden="true">{icon}</span>
            {label}
          </div>
          {isLg && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
              Crowd level
            </div>
          )}
        </div>
      )}
    </div>
  );
}
