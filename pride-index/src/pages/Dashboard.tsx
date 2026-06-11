import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { BAND_COLORS, BAND_ORDER, FLAG_LABELS, companies, fmtPts, sectors } from '../lib/data';
import { bandFor } from '../lib/scoring';
import type { Band, Company } from '../lib/types';
import { BandChip, FlagChips, GradientBar } from '../components/ui';

/* ── Stats strip ───────────────────────────────────────────────────────── */

function Stat({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="font-mono text-2xl" style={{ color: accent ?? '#fff' }}>
        {value}
      </div>
      <div className="label mt-1">{label}</div>
    </div>
  );
}

/* ── Histogram ─────────────────────────────────────────────────────────── */

function Histogram() {
  const bins = useMemo(() => {
    const out: { range: string; mid: number; count: number }[] = [];
    for (let lo = 0; lo < 100; lo += 5) {
      const hi = lo + 4 === 99 ? 100 : lo + 4;
      out.push({
        range: `${lo}–${hi}`,
        mid: lo + 2,
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
            tick={{ fill: '#6b7387', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
            interval={3}
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
            formatter={(v: number) => [`${v} companies`, 'count']}
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

/* ── Sector averages ───────────────────────────────────────────────────── */

function SectorChart() {
  const data = useMemo(
    () => [...sectors].sort((a, b) => b.avgScore - a.avgScore),
    [],
  );
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

/* ── Hall of Shame & Honor ─────────────────────────────────────────────── */

function MoverRow({ c, metric }: { c: Company; metric: string }) {
  return (
    <Link
      to={`/company/${c.slug}`}
      className="flex items-center justify-between gap-3 px-3 py-2 rounded hover:bg-ink-800/70 transition-colors"
    >
      <div className="min-w-0">
        <span className="text-sm text-white">{c.name}</span>
        <span className="ml-2 text-xs text-ink-400">{c.sector}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-ink-300">{metric}</span>
        <span
          className="font-mono text-sm w-8 text-right"
          style={{ color: BAND_COLORS[c.band] }}
        >
          {c.score}
        </span>
      </div>
    </Link>
  );
}

function Movers() {
  const shame = useMemo(
    () =>
      companies
        .filter((c) => c.flags.postJan2025Reversal)
        .sort((a, b) => a.breakdown.negative - b.breakdown.negative)
        .slice(0, 6),
    [],
  );
  const honor = useMemo(
    () =>
      [...companies]
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.breakdown.structural - a.breakdown.structural,
        )
        .slice(0, 6),
    [],
  );
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4 border-red-900/50">
        <p className="label mb-1 text-red-400">Hall of Shame · steepest reversals</p>
        <p className="text-xs text-ink-400 mb-2">
          Post–Jan 2025 reversal companies, ranked by negative-point damage
        </p>
        {shame.map((c) => (
          <MoverRow key={c.slug} c={c} metric={`${fmtPts(c.breakdown.negative)} pts`} />
        ))}
      </div>
      <div className="card p-4 border-emerald-900/50">
        <p className="label mb-1 text-emerald-400">Hall of Honor · highest sustained scores</p>
        <p className="text-xs text-ink-400 mb-2">
          Top scores, weighted toward structural (hard-to-reverse) commitments
        </p>
        {honor.map((c) => (
          <MoverRow key={c.slug} c={c} metric={`structural +${c.breakdown.structural}`} />
        ))}
      </div>
    </div>
  );
}

/* ── Master table ──────────────────────────────────────────────────────── */

type SortKey = 'name' | 'sector' | 'score' | 'hrcCei' | 'pos' | 'neg';

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [band, setBand] = useState<Band | ''>('');
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const filtered = useMemo(() => {
    let rows = companies.filter(
      (c) =>
        (!query || c.name.toLowerCase().includes(query.toLowerCase())) &&
        (!sector || c.sector === sector) &&
        (!band || c.band === band) &&
        [...flags].every((k) => c.flags[k as keyof Company['flags']]),
    );
    const val = (c: Company): string | number => {
      switch (sortKey) {
        case 'name':
          return c.name.toLowerCase();
        case 'sector':
          return c.sector;
        case 'score':
          return c.score;
        case 'hrcCei':
          return c.hrcCei ?? -1;
        case 'pos':
          return c.breakdown.positiveCapped;
        case 'neg':
          return c.breakdown.negative;
      }
    };
    rows = [...rows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
    });
    return rows;
  }, [query, sector, band, flags, sortKey, sortDir]);

  const sort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(k === 'name' || k === 'sector' ? 1 : -1);
    }
  };

  const Th = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th
      onClick={() => sort(k)}
      className={`px-3 py-2 label cursor-pointer select-none hover:text-white whitespace-nowrap ${
        right ? 'text-right' : 'text-left'
      }`}
    >
      {children} {sortKey === k ? (sortDir === 1 ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-10">
      {/* Hero */}
      <section className="max-w-3xl">
        <p className="label mb-3">A data-journalism accountability instrument</p>
        <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">
          Which companies stood by LGBTQ+ people —{' '}
          <span className="italic text-ink-300">and which ones folded under pressure?</span>
        </h1>
        <p className="mt-4 text-ink-300 leading-relaxed">
          The Corporate Pride Index scores {companies.length} major American companies from 0 to
          100 on the depth and consistency of their LGBTQ+ support. Cosmetic gestures are capped;
          structural commitments are rewarded; reversals — especially the post–January 2025
          retreats — are the most damning signal. Every score is recomputed from sourced evidence
          at build time. <Link to="/methodology" className="text-sky-400 hover:underline">Read the methodology.</Link>
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat value={String(companies.length)} label="companies scored" />
        <Stat
          value={String(companies.filter((c) => c.flags.postJan2025Reversal).length)}
          label="post–Jan 2025 reversals"
          accent={BAND_COLORS.Harmful}
        />
        <Stat
          value={String(companies.filter((c) => c.band === 'Champion').length)}
          label="champions (80+)"
          accent={BAND_COLORS.Champion}
        />
        <Stat
          value={(companies.reduce((s, c) => s + c.score, 0) / companies.length).toFixed(1)}
          label="index average"
        />
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Histogram />
        <SectorChart />
      </section>

      <Movers />

      {/* Filters + table */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies…"
            className="bg-ink-900 border border-ink-700 rounded px-3 py-1.5 text-sm w-52 placeholder:text-ink-400 focus:outline-none focus:border-ink-400"
          />
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="bg-ink-900 border border-ink-700 rounded px-2 py-1.5 text-sm text-ink-200"
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s.sector}>{s.sector}</option>
            ))}
          </select>
          <select
            value={band}
            onChange={(e) => setBand(e.target.value as Band | '')}
            className="bg-ink-900 border border-ink-700 rounded px-2 py-1.5 text-sm text-ink-200"
          >
            <option value="">All bands</option>
            {BAND_ORDER.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          {FLAG_LABELS.map((f) => (
            <button
              key={f.key}
              onClick={() =>
                setFlags((prev) => {
                  const next = new Set(prev);
                  next.has(f.key) ? next.delete(f.key) : next.add(f.key);
                  return next;
                })
              }
              className={`text-xs px-2 py-1.5 rounded border transition-colors ${
                flags.has(f.key)
                  ? 'border-red-500/60 bg-red-500/15 text-red-300'
                  : 'border-ink-700 text-ink-300 hover:border-ink-400'
              }`}
            >
              ⚑ {f.short}
            </button>
          ))}
          <span className="ml-auto font-mono text-xs text-ink-400">
            {filtered.length} / {companies.length}
          </span>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-700/60">
              <tr>
                <Th k="name">Company</Th>
                <Th k="sector">Sector</Th>
                <Th k="score" right>
                  Score
                </Th>
                <th className="px-3 py-2 label text-left">Band</th>
                <Th k="hrcCei" right>
                  HRC CEI
                </Th>
                <Th k="pos" right>
                  +Pts
                </Th>
                <Th k="neg" right>
                  −Pts
                </Th>
                <th className="px-3 py-2 label text-left">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.slug}
                  onClick={() => navigate(`/company/${c.slug}`)}
                  className="border-b border-ink-800 last:border-0 cursor-pointer hover:bg-ink-800/60 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <span className="text-white font-medium">{c.name}</span>
                    {c.ticker && (
                      <span className="ml-2 font-mono text-[10px] text-ink-400">{c.ticker}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-ink-300 whitespace-nowrap">{c.sector}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className="font-mono text-base"
                      style={{ color: BAND_COLORS[c.band] }}
                    >
                      {c.score}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <BandChip band={c.band} size="sm" />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-ink-300">
                    {c.hrcCei ?? '—'}
                    {c.stillSubmittingCei === false && (
                      <span className="text-red-400" title="No longer submitting to HRC CEI">
                        {' '}
                        ✕
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-400">
                    +{c.breakdown.positiveCapped}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-red-400">
                    {c.breakdown.negative || '0'}
                  </td>
                  <td className="px-3 py-2.5">
                    <FlagChips flags={c.flags} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-400">
          ✕ next to an HRC CEI score = the company stopped submitting to the Corporate Equality
          Index. Click any row for the full reasoning and evidence.
        </p>
      </section>
    </div>
  );
}
