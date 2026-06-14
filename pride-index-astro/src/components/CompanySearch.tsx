import { useMemo, useState } from 'react';
import { BAND_COLORS, companies } from '../lib/data';
import { BandChip } from './ui';

/**
 * Hero "jump to a company" search. Island (client:load). The original used
 * react-router's useNavigate; here we navigate with a plain location change to
 * the statically-generated company page.
 */
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
    <div className="relative max-w-md">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches.length > 0) go(matches[0].slug);
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
              onClick={() => go(c.slug)}
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
