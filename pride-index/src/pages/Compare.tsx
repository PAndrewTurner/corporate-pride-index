import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BAND_COLORS, companies, companyBySlug, fmtPts, sectors } from '../lib/data';
import type { Company } from '../lib/types';
import { BandChip, FlagChips, GradientBar, TrajectoryBadge } from '../components/ui';

const MAX = 4;
const SERIES_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#fbbf24'];

function Picker({ selected, onChange }: { selected: string[]; onChange: (s: string[]) => void }) {
  const [q, setQ] = useState('');
  const matches = useMemo(
    () =>
      q
        ? companies
            .filter(
              (c) => c.name.toLowerCase().includes(q.toLowerCase()) && !selected.includes(c.slug),
            )
            .slice(0, 8)
        : [],
    [q, selected],
  );
  return (
    <div className="card p-4">
      <p className="label mb-2">Compare 2–4 companies</p>
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((slug) => {
          const c = companyBySlug.get(slug);
          if (!c) return null;
          return (
            <span
              key={slug}
              className="inline-flex items-center gap-2 rounded-full bg-ink-800 border border-ink-600 pl-3 pr-1.5 py-1 text-sm text-white"
            >
              {c.name}
              <button
                onClick={() => onChange(selected.filter((s) => s !== slug))}
                className="w-5 h-5 rounded-full hover:bg-ink-600 text-ink-300"
                aria-label={`Remove ${c.name}`}
              >
                ✕
              </button>
            </span>
          );
        })}
        {selected.length < MAX && (
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Add a company…"
              className="bg-ink-900 border border-ink-700 rounded px-3 py-1.5 text-sm w-48 placeholder:text-ink-400 focus:outline-none focus:border-ink-400"
            />
            {matches.length > 0 && (
              <div className="absolute z-20 mt-1 w-64 card shadow-xl max-h-64 overflow-auto">
                {matches.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => {
                      onChange([...selected, c.slug]);
                      setQ('');
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-ink-800"
                  >
                    <span className="text-white">{c.name}</span>
                    <span className="ml-2 font-mono text-xs" style={{ color: BAND_COLORS[c.band] }}>
                      {c.score}
                    </span>
                    <span className="ml-2 text-xs text-ink-400">{c.sector}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyCard({ c }: { c: Company }) {
  const sectorAvg = sectors.find((s) => s.sector === c.sector)?.avgScore;
  const b = c.breakdown;
  const rows: [string, number, boolean][] = [
    ['Cosmetic+Commercial (cap 20)', b.cosmeticCommercialCapped, true],
    ['Civic', b.civic, true],
    ['Financial', b.financial, true],
    ['Structural', b.structural, true],
    ['Negative', b.negative, false],
  ];
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div>
        <Link
          to={`/company/${c.slug}`}
          className="font-display text-2xl text-white hover:underline leading-tight"
        >
          {c.name}
        </Link>
        <p className="text-xs text-ink-400 mt-0.5">{c.sector}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-5xl" style={{ color: BAND_COLORS[c.band] }}>
          {c.score}
        </span>
        <BandChip band={c.band} />
      </div>
      <GradientBar
        score={c.score}
        height={6}
        markers={sectorAvg !== undefined ? [{ score: sectorAvg, label: `${c.sector} avg` }] : []}
      />
      {sectorAvg !== undefined && (
        <p className="text-[11px] text-ink-400 -mt-2">
          │ sector benchmark: {c.sector} average {sectorAvg}
        </p>
      )}
      <table className="font-mono text-xs w-full">
        <tbody>
          {rows.map(([label, v, pos]) => (
            <tr key={label} className="text-ink-300">
              <td className="py-0.5">{label}</td>
              <td className={`text-right ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtPts(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {c.rationale && (
        <>
          <TrajectoryBadge trajectory={c.rationale.trajectory} />
          <p className="text-xs leading-relaxed text-ink-300 italic">“{c.rationale.verdict}”</p>
        </>
      )}
      <FlagChips flags={c.flags} size="sm" />
    </div>
  );
}

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const selected = useMemo(
    () => (params.get('c') ?? '').split(',').filter((s) => companyBySlug.has(s)).slice(0, MAX),
    [params],
  );
  const setSelected = (slugs: string[]) =>
    setParams(slugs.length ? { c: slugs.join(',') } : {}, { replace: true });

  const picked = selected
    .map((s) => companyBySlug.get(s))
    .filter((c): c is Company => !!c);

  const chartData = useMemo(() => {
    const dims: { key: keyof Company['breakdown']; label: string }[] = [
      { key: 'cosmeticCommercialCapped', label: 'Cosmetic+Comm.' },
      { key: 'civic', label: 'Civic' },
      { key: 'financial', label: 'Financial' },
      { key: 'structural', label: 'Structural' },
      { key: 'negative', label: 'Negative' },
    ];
    return dims.map((d) => {
      const row: Record<string, string | number> = { dim: d.label };
      for (const c of picked) row[c.name] = c.breakdown[d.key];
      return row;
    });
  }, [picked]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-6">
      <div>
        <p className="label mb-2">Side by side</p>
        <h1 className="font-display text-4xl text-white">Compare</h1>
        <p className="mt-2 text-ink-300 text-sm max-w-2xl">
          Put 2–4 companies next to each other — scores, tier-by-tier point composition, and each
          company's position against its own sector benchmark.
        </p>
      </div>

      <Picker selected={selected} onChange={setSelected} />

      {picked.length === 0 && (
        <div className="card p-8 text-center text-ink-300 text-sm">
          Try a telling pair:{' '}
          <button
            className="text-sky-400 hover:underline"
            onClick={() => setSelected(['verizon', 'apple'])}
          >
            Verizon vs Apple
          </button>{' '}
          — similar rainbow histories, opposite 2025 choices.
        </div>
      )}

      {picked.length > 0 && (
        <div
          className={`grid gap-4 ${
            picked.length === 2
              ? 'md:grid-cols-2'
              : picked.length === 3
                ? 'md:grid-cols-3'
                : 'md:grid-cols-2 xl:grid-cols-4'
          }`}
        >
          {picked.map((c) => (
            <CompanyCard key={c.slug} c={c} />
          ))}
        </div>
      )}

      {picked.length >= 2 && (
        <div className="card p-4">
          <p className="label mb-3">Point composition by tier</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#252a37" vertical={false} />
              <XAxis
                dataKey="dim"
                tick={{ fill: '#9aa1b3', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#3a4153' }}
              />
              <YAxis
                tick={{ fill: '#6b7387', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine y={0} stroke="#6b7387" />
              <Tooltip
                cursor={{ fill: '#ffffff0a' }}
                contentStyle={{
                  background: '#14171f',
                  border: '1px solid #3a4153',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#c3c8d4' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {picked.map((c, i) => (
                <Bar
                  key={c.slug}
                  dataKey={c.name}
                  fill={SERIES_COLORS[i]}
                  fillOpacity={0.85}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
