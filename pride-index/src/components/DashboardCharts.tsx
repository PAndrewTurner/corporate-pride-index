import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BAND_COLORS, companies, sectors } from '../lib/data';
import { bandFor } from '../lib/scoring';
import { chartPalette, useTheme } from '../lib/theme';
import { GradientBar } from './ui';

export function Histogram() {
  const { theme } = useTheme();
  const p = chartPalette(theme);
  const bins = useMemo(() => {
    const out: { range: string; mid: number; count: number }[] = [];
    for (let lo = 0; lo < 100; lo += 10) {
      const hi = lo + 9 === 99 ? 100 : lo + 9;
      out.push({
        range: `${lo}–${hi}`,
        mid: lo + 5,
        count: companies.filter((c) => c.score >= lo && c.score <= hi).length,
      });
    }
    return out;
  }, []);
  return (
    <div className="card p-4">
      <p className="label mb-3">Score distribution · all {companies.length} companies</p>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={bins} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={p.grid} vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fill: p.tick, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            interval={0}
            tickLine={false}
            axisLine={{ stroke: p.axis }}
          />
          <YAxis
            tick={{ fill: p.tick, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: p.cursor }}
            contentStyle={{
              background: p.tooltipBg,
              border: `1px solid ${p.tooltipBorder}`,
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: p.tooltipLabel }}
            itemStyle={{ color: p.tooltipItem }}
            formatter={(v: number, _n, pl) => [
              `${v} companies · ${bandFor(pl.payload.mid)}`,
              `score ${pl.payload.range}`,
            ]}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {bins.map((b) => (
              <Cell key={b.range} fill={BAND_COLORS[bandFor(b.mid)]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2">
        <GradientBar height={4} />
      </div>
    </div>
  );
}

export function SectorChart() {
  const { theme } = useTheme();
  const p = chartPalette(theme);
  const data = useMemo(() => [...sectors].sort((a, b) => b.avgScore - a.avgScore), []);
  return (
    <div className="card p-4">
      <p className="label mb-3">Average score by sector</p>
      <ResponsiveContainer width="100%" height={data.length * 26 + 30}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 8, bottom: 0 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="sector"
            width={170}
            tick={{ fill: p.label, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: p.cursor }}
            contentStyle={{
              background: p.tooltipBg,
              border: `1px solid ${p.tooltipBorder}`,
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: p.tooltipLabel }}
            itemStyle={{ color: p.tooltipItem }}
            formatter={(v: number, _n, pl) => [
              `avg ${v} · range ${pl.payload.min}–${pl.payload.max} · ${pl.payload.companies} cos.`,
              pl.payload.sector,
            ]}
            labelFormatter={() => ''}
          />
          <Bar
            dataKey="avgScore"
            barSize={14}
            radius={[0, 3, 3, 0]}
            label={{
              position: 'right',
              fill: p.label,
              fontSize: 11,
              fontFamily: 'IBM Plex Mono',
            }}
          >
            {data.map((s) => (
              <Cell key={s.sector} fill={BAND_COLORS[bandFor(s.avgScore)]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
