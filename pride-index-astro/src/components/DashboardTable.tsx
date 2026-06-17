import { useEffect, useMemo, useState } from 'react';
import { BAND_ORDER, BAND_COLORS, FLAG_LABELS, companies, sectors } from '../lib/data';
import type { Band, Company } from '../lib/types';
import { BandChip, FlagChips } from './ui';

const sectorAvg = new Map(sectors.map((s) => [s.sector, s.avgScore]));
const deltaVsSector = (c: Company) => Math.round((c.score - (sectorAvg.get(c.sector) ?? c.score)) * 10) / 10;

type SortKey = 'name' | 'sector' | 'score' | 'savg' | 'delta' | 'hrcCei' | 'pos' | 'neg';

/** Payload the DashboardStats island dispatches to drive these filters. */
export interface FilterEventDetail {
  band?: Band | '';
  flags?: string[];
}

/** Filter controls + the sortable master table (v2 styling). Island (client:load).
 *  Stat cards filter it via a `cpi:filter` CustomEvent; rows navigate to the
 *  statically-generated company pages. */
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
    const rows = companies.filter(
      (c) =>
        (!query || c.name.toLowerCase().includes(query.toLowerCase()) || c.sector.toLowerCase().includes(query.toLowerCase())) &&
        (!sector || c.sector === sector) &&
        (!band || c.band === band) &&
        [...flags].every((k) => c.flags[k as keyof Company['flags']]),
    );
    const val = (c: Company): string | number => {
      switch (sortKey) {
        case 'name': return c.name.toLowerCase();
        case 'sector': return c.sector;
        case 'score': return c.score;
        case 'savg': return sectorAvg.get(c.sector) ?? -1;
        case 'delta': return deltaVsSector(c);
        case 'hrcCei': return c.hrcCei ?? -1;
        case 'pos': return c.breakdown.positiveCapped;
        case 'neg': return c.breakdown.negative;
      }
    };
    return [...rows].sort((a, b) => {
      const va = val(a), vb = val(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
    });
  }, [query, sector, band, flags, sortKey, sortDir]);

  const sort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(k === 'name' || k === 'sector' ? 1 : -1); }
  };

  const Th = ({ k, children, right, title }: { k: SortKey; children: React.ReactNode; right?: boolean; title?: string }) => (
    <th className={right ? 'r' : undefined} title={title} onClick={() => sort(k)}>
      {children} {sortKey === k ? (sortDir === 1 ? '▲' : '▼') : ''}
    </th>
  );

  const toggleFlag = (key: string) =>
    setFlags((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <section id="master-table" style={{ scrollMarginTop: 84 }}>
      <div className="toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter companies or sectors…" />
        <select value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Filter by sector">
          <option value="">All sectors</option>
          {sectors.map((s) => <option key={s.sector}>{s.sector}</option>)}
        </select>
        <select value={band} onChange={(e) => setBand(e.target.value as Band | '')} aria-label="Filter by band">
          <option value="">All bands</option>
          {BAND_ORDER.map((b) => <option key={b}>{b}</option>)}
        </select>
        {FLAG_LABELS.filter((f) => f.key !== 'juneOnly' && f.key !== 'geoHypocrisy').map((f) => (
          <button key={f.key} className={`flagbtn${flags.has(f.key) ? ' on' : ''}`} onClick={() => toggleFlag(f.key)}>
            ⚑ {f.short}
          </button>
        ))}
        <span className="count">{filtered.length} / {companies.length}</span>
      </div>

      <div className="tablecard">
        <table>
          <thead>
            <tr>
              <Th k="name">Company</Th>
              <Th k="sector">Sector</Th>
              <Th k="score" right>Score</Th>
              <Th k="savg" right title="Average score across this company's sector">Sector Avg</Th>
              <Th k="delta" right title="Score minus this company's sector average">Δ Sector</Th>
              <th>Band</th>
              <Th k="hrcCei" right>HRC CEI</Th>
              <Th k="pos" right>+Pts</Th>
              <Th k="neg" right>−Pts</Th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const d = deltaVsSector(c);
              const dCol = d > 0 ? 'var(--good)' : d < 0 ? 'var(--bad)' : 'var(--txt-mut)';
              return (
                <tr key={c.slug} onClick={() => go(c.slug)}>
                  <td>
                    <span style={{ color: 'var(--ink)' }}>{c.name}</span>
                    {c.ticker && <span className="tkr" style={{ marginLeft: 8 }}>{c.ticker}</span>}
                  </td>
                  <td className="sec">{c.sector}</td>
                  <td className="sc" style={{ color: BAND_COLORS[c.band] }}>{c.score}</td>
                  <td className="r mono" style={{ color: 'var(--txt-mut)' }}>{sectorAvg.get(c.sector) ?? '—'}</td>
                  <td className="r mono" style={{ color: dCol }}>{d > 0 ? `+${d}` : d}</td>
                  <td><BandChip band={c.band} /></td>
                  <td className="r mono" style={{ color: 'var(--txt-2)' }}>
                    {c.hrcCei ?? '—'}
                    {c.stillSubmittingCei === false && <span style={{ color: 'var(--bad)' }} title="No longer submitting to HRC CEI"> ✕</span>}
                  </td>
                  <td className="r mono" style={{ color: 'var(--good)' }}>+{c.breakdown.positiveCapped}</td>
                  <td className="r mono" style={{ color: 'var(--bad)' }}>{c.breakdown.negative || 0}</td>
                  <td className="flagcell"><FlagChips flags={c.flags} size="sm" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, color: 'var(--txt-mut)' }}>
        Δ Sector = score relative to the company's sector average. ✕ next to an HRC CEI score = the company
        stopped submitting to the Corporate Equality Index. Click any row for the full reasoning and evidence.
      </p>
    </section>
  );
}
