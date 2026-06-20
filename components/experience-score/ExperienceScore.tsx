'use client';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExperienceScoreProps {
  score: number;
  trend?: 'up' | 'down' | 'flat';
  size?: 'sm' | 'lg';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-status-good)';
  if (score >= 50) return 'var(--color-status-mid)';
  return 'var(--color-status-bad)';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

export function ExperienceScore({ score, trend = 'flat', size = 'sm' }: ExperienceScoreProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const isLg = size === 'lg';

  const [displayScore, setDisplayScore] = useState(0);
  const prevScore = useRef(0);

  useEffect(() => {
    const controls = animate(prevScore.current, score, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    prevScore.current = score;
    return () => controls.stop();
  }, [score]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--color-status-good)' : trend === 'down' ? 'var(--color-status-bad)' : 'var(--color-text-muted)';

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: isLg ? 'flex-start' : 'center' }}
      role="status"
      aria-label={`Experience score: ${score} out of 100 — ${label}`}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: isLg ? '3rem' : '1.75rem',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color,
          lineHeight: 1,
          textShadow: `0 0 20px ${color}44`,
        }}>
          {displayScore}
        </span>
        <span style={{ fontSize: isLg ? '1rem' : '0.75rem', color: 'var(--color-text-secondary)' }}>
          /100
        </span>
        <TrendIcon
          size={isLg ? 18 : 14}
          color={trendColor}
          aria-label={`Trending ${trend}`}
          strokeWidth={2.5}
        />
      </div>
      <span style={{
        fontSize: isLg ? '0.875rem' : '0.7rem',
        color: 'var(--color-text-secondary)',
        fontWeight: 500,
      }}>
        {label} experience
      </span>
    </div>
  );
}
