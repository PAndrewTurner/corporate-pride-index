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
import { GradientBar } from './ui';

export function Histogram() {
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
          <CartesianGrid strokeDasharray="2 4" stroke="#252a37" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fill: '#6b7387', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            interval={0}
            tickLine={false}
            axisLine={{ stroke: '#3a4153' }}
          />
          <YAxis
            tick={{ fill: '#6b7387', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: '#ffffff0a' }}
            contentStyle={{
              background: '#14171f',
              border: '1px solid #3a4153',
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: '#c3c8d4' }}
            itemStyle={{ color: '#e8eaf0' }}
            formatter={(v: number, _n, p) => [
              `${v} companies · ${bandFor(p.payload.mid)}`,
              `score ${p.payload.range}`,
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
            tick={{ fill: '#9aa1b3', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: '#ffffff0a' }}
            contentStyle={{
              background: '#14171f',
              border: '1px solid #3a4153',
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: '#c3c8d4' }}
            itemStyle={{ color: '#e8eaf0' }}
            formatter={(v: number, _n, p) => [
              `avg ${v} · range ${p.payload.min}–${p.payload.max} · ${p.payload.companies} cos.`,
              p.payload.sector,
            ]}
            labelFormatter={() => ''}
          />
          <Bar
            dataKey="avgScore"
            barSize={14}
            radius={[0, 3, 3, 0]}
            label={{
              position: 'right',
              fill: '#c3c8d4',
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
