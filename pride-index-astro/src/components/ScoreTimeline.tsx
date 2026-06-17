import {
  CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BAND_COLORS, fmtPts } from '../lib/data';
import { bandFor } from '../lib/scoring';
import { chartPalette, useTheme } from '../lib/theme';
import type { Company, TimelineEntry } from '../lib/types';

function TimelineChart({ c }: { c: Company }) {
  const { theme } = useTheme();
  const p = chartPalette(theme);
  const changeYears = new Set(c.timelineEntries.filter((e) => e.entryType !== 'Baseline').map((e) => e.year));
  return (
    <div className="tlchart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={c.timeline} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={p.grid} vertical={false} />
          <XAxis dataKey="year" tick={{ fill: p.tick, fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={{ stroke: p.axis }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} ticks={[0, 20, 35, 50, 65, 80, 100]} tick={{ fill: p.tick, fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
          <ReferenceLine y={50} stroke={p.zeroLine} strokeDasharray="4 4" strokeOpacity={0.5} />
          <Tooltip
            cursor={{ stroke: p.cursor }}
            contentStyle={{ background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: p.tooltipLabel }}
            itemStyle={{ color: p.tooltipItem }}
            formatter={(v: number) => [`${v} · ${bandFor(v)}`, 'score']}
          />
          <Line
            type="stepAfter" dataKey="score" stroke={p.label} strokeWidth={1.5} isAnimationActive={false}
            dot={({ cx, cy, payload }) => {
              const changed = changeYears.has(payload.year);
              return (
                <circle key={payload.year} cx={cx} cy={cy} r={changed ? 4.5 : 2.5}
                  fill={BAND_COLORS[bandFor(payload.score)]} stroke={changed ? p.tooltipBg : 'none'} strokeWidth={changed ? 1.5 : 0} />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="cap">Larger dots mark years the score changed — each one is explained below. Dashed line: the neutral baseline of 50.</p>
    </div>
  );
}

function EntryCard({ e }: { e: TimelineEntry }) {
  const color = BAND_COLORS[bandFor(e.score)];
  return (
    <li style={{ ['--dot' as string]: color }}>
      <span className="yr" style={{ color }}>{e.year}</span> <span className="yr">{e.score}</span>
      {e.delta !== null && e.delta !== 0 && (
        <span className="delta" style={{ color: e.delta < 0 ? 'var(--bad)' : 'var(--good)' }}>{fmtPts(e.delta)}</span>
      )}
      <div className="rat">{e.rationale}</div>
      {e.evidence.length > 0 && (
        <div className="evs">
          {e.evidence.map((ev, i) =>
            ev.url ? (
              <a key={i} className="ev" href={ev.url} target="_blank" rel="noopener noreferrer">
                {ev.points !== null && (
                  <span style={{ color: ev.points < 0 ? 'var(--bad)' : 'var(--good)' }}>{fmtPts(ev.points)} </span>
                )}
                {ev.actionId} ↗
              </a>
            ) : (
              <span key={i} className="ev">{ev.raw}</span>
            ),
          )}
        </div>
      )}
    </li>
  );
}

export default function ScoreTimeline({ c }: { c: Company }) {
  if (c.timeline.length === 0) return null;
  const first = c.timeline[0];
  const last = c.timeline[c.timeline.length - 1];
  const change = c.timelineChange ?? last.score - first.score;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px', fontSize: 14, margin: '12px 0' }}>
        <span style={{ color: 'var(--txt-2)' }}>
          {first.year} <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>{first.score}</span> →{' '}
          {last.year} <span style={{ fontFamily: 'var(--mono)', color: BAND_COLORS[bandFor(last.score)] }}>{last.score}</span>
        </span>
        <span style={{ fontFamily: 'var(--mono)', color: change < 0 ? 'var(--bad)' : change > 0 ? 'var(--good)' : 'var(--txt-mut)' }}>
          {change === 0 ? '±0' : fmtPts(change)}
        </span>
        {c.trajectoryShape && <span className="badge">{c.trajectoryShape}</span>}
      </div>
      <TimelineChart c={c} />
      <ul className="tl" style={{ marginTop: 18 }}>
        {c.timelineEntries.map((e) => <EntryCard key={e.year} e={e} />)}
      </ul>
    </div>
  );
}
