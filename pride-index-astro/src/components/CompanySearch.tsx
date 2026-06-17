import { useMemo, useState } from 'react';
import { BAND_COLORS, companies } from '../lib/data';
import { BandChip } from './ui';

/** Hero "jump to a company" search. Island (client:load). Navigates to the
 *  statically-generated company page. */
export default function CompanySearch({ base = '/' }: { base?: string }) {
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
  const go = (slug: string) => {
    window.location.href = `${base}company/${slug}`;
  };
  return (
    <div className="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches.length > 0) go(matches[0].slug);
        }}
        placeholder="Look up a company — e.g. Verizon, Target, Apple…"
        aria-label="Look up a company"
      />
      {matches.length > 0 && (
        <div
          style={{
            position: 'absolute', zIndex: 30, marginTop: 6, width: '100%',
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
            boxShadow: '0 30px 60px -28px #000', maxHeight: 320, overflow: 'auto',
          }}
        >
          {matches.map((c) => (
            <button
              key={c.slug}
              onClick={() => go(c.slug)}
              style={{
                display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, padding: '11px 16px', background: 'transparent', border: 0, cursor: 'pointer',
                textAlign: 'left', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--txt)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(var(--tint),0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>
                <span style={{ color: 'var(--ink)' }}>{c.name}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--txt-mut)' }}>{c.sector}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--mono)', color: BAND_COLORS[c.band] }}>{c.score}</span>
                <BandChip band={c.band} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
