import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BAND_COLORS, fmtPts } from '../lib/data';
import { bandFor } from '../lib/scoring';
import { chartPalette, useTheme } from '../lib/theme';
import type { Company, TimelineEntry } from '../lib/types';

/* ── Chart: yearly score 2015 → now ────────────────────────────────────── */

function TimelineChart({ c }: { c: Company }) {
  const { theme } = useTheme();
  const p = chartPalette(theme);
  const changeYears = new Set(
    c.timelineEntries.filter((e) => e.entryType !== 'Baseline').map((e) => e.year),
  );
  return (
    <div className="card p-4">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={c.timeline} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={p.grid} vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: p.tick, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={{ stroke: p.axis }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 35, 50, 65, 80, 100]}
            tick={{ fill: p.tick, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={50} stroke={p.zeroLine} strokeDasharray="4 4" strokeOpacity={0.5} />
          <Tooltip
            cursor={{ stroke: p.cursor }}
            contentStyle={{
              background: p.tooltipBg,
              border: `1px solid ${p.tooltipBorder}`,
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: p.tooltipLabel }}
            itemStyle={{ color: p.tooltipItem }}
            formatter={(v: number) => [`${v} · ${bandFor(v)}`, 'score']}
          />
          <Line
            type="stepAfter"
            dataKey="score"
            stroke={p.label}
            strokeWidth={1.5}
            isAnimationActive={false}
            dot={({ cx, cy, payload }) => {
              const changed = changeYears.has(payload.year);
              return (
                <circle
                  key={payload.year}
                  cx={cx}
                  cy={cy}
                  r={changed ? 4.5 : 2.5}
                  fill={BAND_COLORS[bandFor(payload.score)]}
                  stroke={changed ? p.tooltipBg : 'none'}
                  strokeWidth={changed ? 1.5 : 0}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[11px] text-ink-400">
        Larger dots mark years the score changed — each one is explained below. Dashed line: the
        neutral baseline of 50.
      </p>
    </div>
  );
}

/* ── One rationale entry on the vertical timeline ──────────────────────── */

function EntryCard({ e }: { e: TimelineEntry }) {
  const color = BAND_COLORS[bandFor(e.score)];
  const deltaColor =
    e.delta === null ? '' : e.delta < 0 ? 'text-red-400' : 'text-emerald-400';
  return (
    <li className="relative pl-6">
      <span
        className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2"
        style={{ borderColor: color, backgroundColor: `${color}33` }}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-lg text-white">{e.year}</span>
        <span className="font-mono text-lg" style={{ color }}>
          {e.score}
        </span>
        {e.delta !== null && e.delta !== 0 && (
          <span className={`font-mono text-sm ${deltaColor}`}>{fmtPts(e.delta)}</span>
        )}
        <span className="label">{e.entryType === 'Baseline' ? 'baseline' : 'score change'}</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-200">{e.rationale}</p>
      {e.evidence.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {e.evidence.map((ev, i) =>
            ev.url ? (
              <a
                key={i}
                href={ev.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-ink-700 px-2 py-0.5 text-[11px] text-ink-300 hover:text-white hover:border-ink-400 transition-colors"
              >
                {ev.points !== null && (
                  <span
                    className={`font-mono ${ev.points < 0 ? 'text-red-400' : 'text-emerald-400'}`}
                  >
                    {fmtPts(ev.points)}
                  </span>
                )}
                <span className="font-mono">{ev.actionId}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span
                key={i}
                className="inline-flex items-center rounded border border-ink-800 px-2 py-0.5 text-[11px] text-ink-400"
              >
                {ev.raw}
              </span>
            ),
          )}
        </div>
      )}
    </li>
  );
}

/* ── Section: chart + year-by-year rationale ───────────────────────────── */

export default function ScoreTimeline({ c }: { c: Company }) {
  if (c.timeline.length === 0) return null;
  const first = c.timeline[0];
  const last = c.timeline[c.timeline.length - 1];
  const change = c.timelineChange ?? last.score - first.score;
  const changeColor = change < 0 ? 'text-red-400' : change > 0 ? 'text-emerald-400' : 'text-ink-300';
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-ink-300">
          {first.year} <span className="font-mono text-white">{first.score}</span> →{' '}
          {last.year}{' '}
          <span className="font-mono" style={{ color: BAND_COLORS[bandFor(last.score)] }}>
            {last.score}
          </span>
        </span>
        <span className={`font-mono ${changeColor}`}>
          {change === 0 ? '±0' : fmtPts(change)}
        </span>
        {c.trajectoryShape && (
          <span className="rounded-full border border-ink-700 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-ink-300">
            {c.trajectoryShape}
          </span>
        )}
      </div>
      <TimelineChart c={c} />
      <ol className="space-y-6 border-l border-ink-800 ml-1.5 pl-0 [&>li]:ml-[-7px]">
        {c.timelineEntries.map((e) => (
          <EntryCard key={e.year} e={e} />
        ))}
      </ol>
    </div>
  );
}
