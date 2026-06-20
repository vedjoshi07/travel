'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface PredictionGraphProps {
  series: { hour: string; crowdPercent: number }[];
  bestWindow?: { start: string; end: string };
  height?: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const color = val < 35 ? 'var(--color-status-good)' : val < 70 ? 'var(--color-status-mid)' : 'var(--color-status-bad)';
  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1px solid var(--color-surface-border)',
      borderRadius: 10,
      padding: '8px 12px',
      fontSize: '0.78rem',
    }}>
      <div style={{ color: 'var(--color-text-secondary)', marginBottom: 2 }}>{label}</div>
      <div style={{ color, fontWeight: 700, fontSize: '1rem' }}>{val}%</div>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
        {val < 35 ? '● Low crowd' : val < 70 ? '● Medium crowd' : '● High crowd'}
      </div>
    </div>
  );
}

export function PredictionGraph({ series, bestWindow, height = 180 }: PredictionGraphProps) {
  return (
    <div>
      {/* Best window callout */}
      {bestWindow && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'rgba(46, 204, 113, 0.08)',
          border: '1px solid rgba(46, 204, 113, 0.2)',
          borderRadius: 10,
          marginBottom: 12,
          fontSize: '0.78rem',
        }}>
          <span style={{ color: 'var(--color-status-good)' }} aria-hidden="true">✦</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
            Best time to visit:{' '}
            <strong style={{ color: 'var(--color-status-good)' }}>
              {bestWindow.start} – {bestWindow.end}
            </strong>
          </span>
        </div>
      )}

      {/* Chart */}
      <div
        role="img"
        aria-label={`Crowd forecast chart. ${series.map(s => `${s.hour}: ${s.crowdPercent}%`).join(', ')}`}
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={series} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Threshold lines */}
            <ReferenceLine y={35} stroke="rgba(46,204,113,0.2)" strokeDasharray="4 4" />
            <ReferenceLine y={70} stroke="rgba(231,76,60,0.2)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="crowdPercent"
              stroke="url(#crowdGradient)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-accent)', stroke: 'var(--color-bg)', strokeWidth: 2 }}
            />
            <defs>
              <linearGradient id="crowdGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7B5CFA" />
                <stop offset="50%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible data table (screen reader) */}
      <table style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        <caption>Hourly crowd forecast</caption>
        <thead><tr><th>Hour</th><th>Crowd %</th></tr></thead>
        <tbody>
          {series.map((row) => (
            <tr key={row.hour}>
              <td>{row.hour}</td>
              <td>{row.crowdPercent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
