import { useEffect, useMemo, useState } from 'react';
import { BAND_ORDER, BAND_COLORS, FLAG_LABELS, companies, sectors } from '../lib/data';
import type { Band, Company } from '../lib/types';
import { BandChip, FlagChips } from './ui';

const sectorAvg = new Map(sectors.map((s) => [s.sector, s.avgScore]));
const deltaVsSector = (c: Company) => c.score - (sectorAvg.get(c.sector) ?? c.score);

type SortKey = 'name' | 'sector' | 'score' | 'delta' | 'hrcCei' | 'pos' | 'neg';

/** Payload the DashboardStats island dispatches to drive these filters. */
export interface FilterEventDetail {
  band?: Band | '';
  flags?: string[];
}

/**
 * Filter controls + the sortable master table. Island (client:load). The
 * clickable stat cards live in a separate island (DashboardStats) above the
 * charts, so they communicate via a `cpi:filter` CustomEvent — preserving the
 * original page layout (stats → charts → movers → table) while keeping the
 * "click a stat to filter the table" behaviour. Row clicks navigate to the
 * statically-generated company pages instead of using react-router.
 */
export default function DashboardTable({ base = '/' }: { base?: string }) {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [band, setBand] = useState<Band | ''>('');
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const go = (slug: string) => {
    window.location.href = `${base}company/${slug}`;
  };

  // Apply filters dispatched by the stat cards above the charts.
  useEffect(() => {
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent<FilterEventDetail>).detail || {};
      if (detail.band !== undefined) setBand(detail.band);
      if (detail.flags !== undefined) setFlags(new Set(detail.flags));
    };
    window.addEventListener('cpi:filter', onFilter as EventListener);
    return () => window.removeEventListener('cpi:filter', onFilter as EventListener);
  }, []);

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
    <div className="space-y-10">
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
                    onClick={() => go(c.slug)}
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
