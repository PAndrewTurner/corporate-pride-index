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
import type { SectorTimelinePoint } from '../lib/data';
import { bandFor } from '../lib/scoring';
import { chartPalette, useTheme } from '../lib/theme';

/* Median + average score for a whole sector, 2015 → now.
   Median is the headline line (robust to Apple/Tesla-style outliers);
   average is shown dashed for reference. */
export default function SectorTimelineChart({ data }: { data: SectorTimelinePoint[] }) {
  const { theme } = useTheme();
  const p = chartPalette(theme);
  return (
    <div className="card p-4">
      <div className="flex items-center gap-4 mb-2 text-[11px] text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5" style={{ background: p.label }} /> median
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0.5"
            style={{ background: p.tick, opacity: 0.8 }}
          />{' '}
          average
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
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
            formatter={(v: number, name) => [`${v} · ${bandFor(v)}`, name]}
          />
          <Line
            type="monotone"
            name="average"
            dataKey="avg"
            stroke={p.tick}
            strokeWidth={1.25}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            name="median"
            dataKey="median"
            stroke={p.label}
            strokeWidth={2}
            isAnimationActive={false}
            dot={{ r: 2.5, fill: p.label }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[11px] text-ink-400">
        Median is the typical company in the sector — unmoved by a single outlier at either
        extreme. Dashed line: the neutral baseline of 50.
      </p>
    </div>
  );
}
