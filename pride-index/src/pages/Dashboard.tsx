import { Suspense, lazy, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BAND_COLORS, BAND_ORDER, FLAG_LABELS, companies, fmtPts, sectors } from '../lib/data';
import type { Band, Company } from '../lib/types';
import { BandChip, FlagChips, WordmarkLogo } from '../components/ui';

const Histogram = lazy(() =>
  import('../components/DashboardCharts').then((m) => ({ default: m.Histogram })),
);
const SectorChart = lazy(() =>
  import('../components/DashboardCharts').then((m) => ({ default: m.SectorChart })),
);

const sectorAvg = new Map(sectors.map((s) => [s.sector, s.avgScore]));


/* ── Jump-to-company search ────────────────────────────────────────────── */

function CompanySearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const matches = useMemo(
    () =>
      q
        ? companies
            .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
        : [],
    [q],
  );
  return (
    <div className="relative max-w-md">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches.length > 0)
            navigate(`/company/${matches[0].slug}`);
        }}
        placeholder="Look up a company — e.g. Verizon, Target, Apple…"
        className="w-full bg-ink-900 border border-ink-600 rounded-lg px-4 py-2.5 text-sm placeholder:text-ink-400 focus:outline-none focus:border-ink-400"
        aria-label="Look up a company"
      />
      {matches.length > 0 && (
        <div className="absolute z-30 mt-1 w-full card shadow-xl max-h-80 overflow-auto">
          {matches.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate(`/company/${c.slug}`)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-ink-800 text-left"
            >
              <span>
                <span className="text-white">{c.name}</span>
                <span className="ml-2 text-xs text-ink-400">{c.sector}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="font-mono" style={{ color: BAND_COLORS[c.band] }}>
                  {c.score}
                </span>
                <BandChip band={c.band} size="sm" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Stats strip ───────────────────────────────────────────────────────── */

function Stat({
  value,
  label,
  accent,
  onClick,
}: {
  value: string;
  label: string;
  accent?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="font-mono text-2xl text-white" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="label mt-1">
        {label}
        {onClick && <span className="ml-1 normal-case text-ink-600">→ filter</span>}
      </div>
    </>
  );
  if (onClick)
    return (
      <button
        onClick={onClick}
        className="card px-4 py-3 text-left hover:border-ink-400 transition-colors cursor-pointer"
      >
        {inner}
      </button>
    );
  return <div className="card px-4 py-3">{inner}</div>;
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
        <span className="font-mono text-sm w-8 text-right" style={{ color: BAND_COLORS[c.band] }}>
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
        .sort((a, b) => b.score - a.score || b.breakdown.structural - a.breakdown.structural)
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

type SortKey = 'name' | 'sector' | 'score' | 'delta' | 'hrcCei' | 'pos' | 'neg';

const deltaVsSector = (c: Company) => c.score - (sectorAvg.get(c.sector) ?? c.score);

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [band, setBand] = useState<Band | ''>('');
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const jumpToTable = (apply: () => void) => {
    apply();
    document.getElementById('master-table')?.scrollIntoView({ behavior: 'smooth' });
  };

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
        case 'delta':
          return deltaVsSector(c);
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

  const Th = ({
    k,
    children,
    right,
    title,
  }: {
    k: SortKey;
    children: React.ReactNode;
    right?: boolean;
    title?: string;
  }) => (
    <th
      onClick={() => sort(k)}
      title={title}
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
      <section className="flex items-center gap-10">
        <div className="max-w-3xl min-w-0">
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
            at build time.{' '}
            <Link to="/methodology" className="text-sky-400 hover:underline">
              Read the methodology.
            </Link>
          </p>
          <div className="mt-5">
            <CompanySearch />
          </div>
        </div>
        <WordmarkLogo />
      </section>

      {/* Future enhancements teaser */}
      <section className="card px-4 py-3 text-sm leading-relaxed">
        <span className="label mr-2">Future enhancements:</span>
        <span className="text-ink-300">
          public evidence submissions with tiered, AI-assisted verification · company
          self-submission and score appeals · year-over-year score tracking · legislative mapping
          of political donations · expanded company universe.{' '}
          <Link to="/future" className="text-sky-400 hover:underline whitespace-nowrap">
            See the full roadmap →
          </Link>
        </span>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat value={String(companies.length)} label="companies scored" />
        <Stat
          value={String(companies.filter((c) => c.flags.postJan2025Reversal).length)}
          label="post–Jan 2025 reversals"
          accent={BAND_COLORS.Harmful}
          onClick={() =>
            jumpToTable(() => {
              setBand('');
              setFlags(new Set(['postJan2025Reversal']));
            })
          }
        />
        <Stat
          value={String(companies.filter((c) => c.band === 'Champion').length)}
          label="champions (80+)"
          accent={BAND_COLORS.Champion}
          onClick={() =>
            jumpToTable(() => {
              setFlags(new Set());
              setBand('Champion');
            })
          }
        />
        <Stat
          value={(companies.reduce((s, c) => s + c.score, 0) / companies.length).toFixed(1)}
          label="index average"
        />
      </section>

      {/* Charts (lazy — recharts loads after first paint) */}
      <section className="grid lg:grid-cols-2 gap-4">
        <Suspense fallback={<div className="card p-4 h-64 animate-pulse" />}>
          <Histogram />
        </Suspense>
        <Suspense fallback={<div className="card p-4 h-64 animate-pulse" />}>
          <SectorChart />
        </Suspense>
      </section>

      <Movers />

      {/* Filters + table */}
      <section id="master-table" className="scroll-mt-20">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter table…"
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
          {/* June-only and geo-hypocrisy are omitted: no company currently
              carries either flag, so the filters would always return nothing. */}
          {FLAG_LABELS.filter((f) => f.key !== 'juneOnly' && f.key !== 'geoHypocrisy').map((f) => (
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
                <Th k="delta" right title="Score minus this company's sector average">
                  Δ Sector
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
              {filtered.map((c) => {
                const delta = Math.round(deltaVsSector(c) * 10) / 10;
                return (
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
                      <span className="font-mono text-base" style={{ color: BAND_COLORS[c.band] }}>
                        {c.score}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-mono text-xs ${
                        delta > 0 ? 'text-emerald-400/80' : delta < 0 ? 'text-red-400/80' : 'text-ink-400'
                      }`}
                      title={`${c.sector} average: ${sectorAvg.get(c.sector)}`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
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
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Δ Sector = score relative to the company's sector average. ✕ next to an HRC CEI score =
          the company stopped submitting to the Corporate Equality Index. Click any row for the
          full reasoning and evidence.
        </p>
      </section>
    </div>
  );
}
