import { Link } from 'react-router-dom';
import { BAND_COLORS, companiesInSector, median, sectors, slugifySector } from '../lib/data';
import { bandFor } from '../lib/scoring';
import { BandChip, SectionHeading } from '../components/ui';

export default function Sectors() {
  const rows = sectors
    .map((s) => {
      const cs = companiesInSector(s.sector);
      return { ...s, med: median(cs.map((c) => c.score)) };
    })
    .sort((a, b) => b.med - a.med);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      <header>
        <p className="label mb-2">The index, grouped</p>
        <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Sectors</h1>
        <p className="mt-4 text-ink-300 leading-relaxed max-w-2xl">
          How each industry has moved over the past decade. Pick a sector to see its median and
          average score from 2015 to now, then every company in the index that belongs to it. The
          median is the typical company — it won&apos;t be skewed by a single champion or a single
          adversary in the same industry.
        </p>
      </header>

      <SectionHeading kicker="Ranked by median score" title="All sectors" />
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.map((s) => (
          <Link
            key={s.sector}
            to={`/sectors/${slugifySector(s.sector)}`}
            className="card p-4 hover:border-ink-500 transition-colors flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{s.sector}</p>
              <p className="mt-0.5 text-xs text-ink-400">
                {s.companies} {s.companies === 1 ? 'company' : 'companies'} · avg{' '}
                <span className="font-mono">{s.avgScore}</span>
                {s.champions > 0 && <span> · {s.champions} champion{s.champions > 1 ? 's' : ''}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="font-mono text-2xl" style={{ color: BAND_COLORS[bandFor(s.med)] }}>
                  {s.med}
                </div>
                <p className="label text-[10px]">median</p>
              </div>
              <BandChip band={bandFor(s.med)} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
