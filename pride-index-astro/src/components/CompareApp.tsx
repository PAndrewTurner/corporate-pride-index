import { useEffect, useMemo, useState } from 'react';
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
import { chartPalette, useTheme } from '../lib/theme';
import type { Company } from '../lib/types';
import { BandChip, FlagChips, GradientBar, TrajectoryBadge } from './ui';

const MAX = 4;
const SERIES_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#fbbf24'];

function Picker({
  selected,
  onChange,
  base,
}: {
  selected: string[];
  onChange: (s: string[]) => void;
  base: string;
}) {
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

function CompanyCard({ c, base }: { c: Company; base: string }) {
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
        <a
          href={`${base}company/${c.slug}`}
          className="font-display text-2xl text-white hover:underline leading-tight"
        >
          {c.name}
        </a>
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

/**
 * Full Compare tool. Island (client:load). Replaces react-router's
 * useSearchParams with direct URLSearchParams + history.replaceState so the
 * shareable ?c=slug,slug URL behaviour is preserved on the static page.
 */
export default function CompareApp({ base = '/' }: { base?: string }) {
  const { theme } = useTheme();
  const p = chartPalette(theme);

  const [selected, setSelectedState] = useState<string[]>([]);

  // Hydrate selection from the URL on mount and on back/forward navigation.
  useEffect(() => {
    const read = () => {
      const c = new URLSearchParams(window.location.search).get('c') ?? '';
      setSelectedState(c.split(',').filter((s) => companyBySlug.has(s)).slice(0, MAX));
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const setSelected = (slugs: string[]) => {
    setSelectedState(slugs);
    const url = new URL(window.location.href);
    if (slugs.length) url.searchParams.set('c', slugs.join(','));
    else url.searchParams.delete('c');
    window.history.replaceState({}, '', url);
  };

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
    <div className="space-y-6">
      <Picker selected={selected} onChange={setSelected} base={base} />

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
            <CompanyCard key={c.slug} c={c} base={base} />
          ))}
        </div>
      )}

      {picked.length >= 2 && (
        <div className="card p-4">
          <p className="label mb-3">Point composition by tier</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={p.grid} vertical={false} />
              <XAxis
                dataKey="dim"
                tick={{ fill: p.label, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: p.axis }}
              />
              <YAxis
                tick={{ fill: p.tick, fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine y={0} stroke={p.zeroLine} />
              <Tooltip
                cursor={{ fill: p.cursor }}
                contentStyle={{
                  background: p.tooltipBg,
                  border: `1px solid ${p.tooltipBorder}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelStyle={{ color: p.tooltipLabel }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: p.label }} />
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
