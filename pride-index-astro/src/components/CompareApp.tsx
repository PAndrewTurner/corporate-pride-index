import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BAND_COLORS, companies, companyBySlug, fmtPts, sectors } from '../lib/data';
import { chartPalette, useTheme } from '../lib/theme';
import type { Company } from '../lib/types';
import { BandChip, FlagChips, GradientBar, TrajectoryBadge } from './ui';

const MAX = 4;
const SERIES_COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#fbbf24'];

const card: React.CSSProperties = {
  border: '1px solid var(--line)', borderRadius: 18, padding: '20px 22px',
  background: 'linear-gradient(180deg, rgba(var(--tint),0.035), rgba(var(--tint),0.008))',
};
const inputStyle: React.CSSProperties = {
  background: 'rgba(var(--tint),0.06)', border: '1px solid rgba(var(--tint),0.2)', borderRadius: 10,
  padding: '9px 13px', color: 'var(--txt)', fontFamily: 'var(--sans)', fontSize: 14, width: 200,
};

function Picker({ selected, onChange, base }: { selected: string[]; onChange: (s: string[]) => void; base: string }) {
  const [q, setQ] = useState('');
  const matches = useMemo(
    () => (q ? companies.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) && !selected.includes(c.slug)).slice(0, 8) : []),
    [q, selected],
  );
  return (
    <div style={card}>
      <div className="d-k" style={{ marginBottom: 12 }}>Compare 2–4 companies</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {selected.map((slug) => {
          const c = companyBySlug.get(slug);
          if (!c) return null;
          return (
            <span key={slug} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 99, background: 'rgba(var(--tint),0.06)', border: '1px solid var(--line)', padding: '5px 6px 5px 13px', fontSize: 14, color: 'var(--ink)' }}>
              {c.name}
              <button onClick={() => onChange(selected.filter((s) => s !== slug))} aria-label={`Remove ${c.name}`}
                style={{ width: 20, height: 20, borderRadius: 99, border: 0, background: 'transparent', color: 'var(--txt-mut)', cursor: 'pointer' }}>✕</button>
            </span>
          );
        })}
        {selected.length < MAX && (
          <div style={{ position: 'relative' }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a company…" style={inputStyle} />
            {matches.length > 0 && (
              <div style={{ position: 'absolute', zIndex: 20, marginTop: 6, width: 260, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 30px 60px -28px #000', maxHeight: 260, overflow: 'auto' }}>
                {matches.map((c) => (
                  <button key={c.slug} onClick={() => { onChange([...selected, c.slug]); setQ(''); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 13px', background: 'transparent', border: 0, cursor: 'pointer', fontSize: 14, color: 'var(--txt)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(var(--tint),0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ color: 'var(--ink)' }}>{c.name}</span>
                    <span style={{ marginLeft: 8, fontFamily: 'var(--mono)', fontSize: 12, color: BAND_COLORS[c.band] }}>{c.score}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--txt-mut)' }}>{c.sector}</span>
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
    ['Cosmetic + Commercial (cap 20)', b.cosmeticCommercialCapped, true],
    ['Substantive (diminished)', b.substantiveDiminished, true],
    ['Negative (diminished)', b.negative, false],
  ];
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <a href={`${base}company/${c.slug}`} style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', textDecoration: 'none' }}>{c.name}</a>
        <div style={{ fontSize: 12, color: 'var(--txt-mut)', marginTop: 2 }}>{c.sector}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 50, lineHeight: 1, color: BAND_COLORS[c.band] }}>{c.score}</span>
        <BandChip band={c.band} />
      </div>
      <GradientBar score={c.score} markers={sectorAvg !== undefined ? [{ score: sectorAvg, label: `${c.sector} avg` }] : []} />
      {sectorAvg !== undefined && <div style={{ fontSize: 11, color: 'var(--txt-mut)', marginTop: -8 }}>│ sector benchmark: {c.sector} average {sectorAvg}</div>}
      <table className="brk">
        <tbody>
          {rows.map(([label, v, pos]) => (
            <tr key={label}><td>{label}</td><td className="v" style={{ color: pos ? 'var(--good)' : 'var(--bad)' }}>{fmtPts(v)}</td></tr>
          ))}
        </tbody>
      </table>
      {c.rationale && (
        <>
          <TrajectoryBadge trajectory={c.rationale.trajectory} />
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--txt-2)', fontStyle: 'italic' }}>“{c.rationale.verdict}”</p>
        </>
      )}
      <FlagChips flags={c.flags} size="sm" />
    </div>
  );
}

export default function CompareApp({ base = '/' }: { base?: string }) {
  const { theme } = useTheme();
  const p = chartPalette(theme);
  const [selected, setSelectedState] = useState<string[]>([]);

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

  const picked = selected.map((s) => companyBySlug.get(s)).filter((c): c is Company => !!c);

  const chartData = useMemo(() => {
    const dims: { key: keyof Company['breakdown']; label: string }[] = [
      { key: 'cosmeticCommercialCapped', label: 'Cosmetic+Comm.' },
      { key: 'substantiveDiminished', label: 'Substantive' },
      { key: 'negative', label: 'Negative' },
    ];
    return dims.map((d) => {
      const row: Record<string, string | number> = { dim: d.label };
      for (const c of picked) row[c.name] = c.breakdown[d.key];
      return row;
    });
  }, [picked]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Picker selected={selected} onChange={setSelected} base={base} />

      {picked.length === 0 && (
        <div style={{ ...card, textAlign: 'center', color: 'var(--txt-2)', fontSize: 14, padding: '40px 20px' }}>
          Try a telling pair:{' '}
          <button onClick={() => setSelected(['verizon', 'apple'])} style={{ background: 'transparent', border: 0, color: 'var(--link)', cursor: 'pointer', font: 'inherit' }}>Verizon vs Apple</button>{' '}
          — similar rainbow histories, opposite 2025 choices.
        </div>
      )}

      {picked.length > 0 && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: `repeat(${Math.min(picked.length, 4)}, minmax(0, 1fr))` }}>
          {picked.map((c) => <CompanyCard key={c.slug} c={c} base={base} />)}
        </div>
      )}

      {picked.length >= 2 && (
        <div style={card}>
          <div className="d-k" style={{ marginBottom: 14 }}>Point composition by tier</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={p.grid} vertical={false} />
              <XAxis dataKey="dim" tick={{ fill: p.label, fontSize: 11 }} tickLine={false} axisLine={{ stroke: p.axis }} />
              <YAxis tick={{ fill: p.tick, fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <ReferenceLine y={0} stroke={p.zeroLine} />
              <Tooltip cursor={{ fill: p.cursor }} contentStyle={{ background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 6, fontSize: 12 }} labelStyle={{ color: p.tooltipLabel }} />
              <Legend wrapperStyle={{ fontSize: 12, color: p.label }} />
              {picked.map((c, i) => <Bar key={c.slug} dataKey={c.name} fill={SERIES_COLORS[i]} fillOpacity={0.85} radius={[2, 2, 0, 0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
