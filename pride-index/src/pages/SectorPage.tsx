import { Suspense, lazy } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BAND_COLORS,
  companiesInSector,
  fmtPts,
  median,
  sectorBySlug,
  sectorTimeline,
} from '../lib/data';
import { bandFor } from '../lib/scoring';
import { BandChip, FlagChips, SectionHeading } from '../components/ui';

const SectorTimelineChart = lazy(() => import('../components/SectorTimelineChart'));

export default function SectorPage() {
  const { slug } = useParams();
  const stat = slug ? sectorBySlug.get(slug) : undefined;

  if (!stat) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-white">Sector not found</h1>
        <Link to="/sectors" className="text-sky-400 hover:underline text-sm mt-3 inline-block">
          ← All sectors
        </Link>
      </div>
    );
  }

  const cs = companiesInSector(stat.sector);
  const series = sectorTimeline(stat.sector);
  const med = median(cs.map((c) => c.score));
  const first = series[0];
  const last = series[series.length - 1];
  const change = last && first ? Math.round((last.median - first.median) * 10) / 10 : 0;
  const changeColor =
    change < 0 ? 'text-red-400' : change > 0 ? 'text-emerald-400' : 'text-ink-300';

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-10">
      <Link to="/sectors" className="text-xs text-ink-400 hover:text-white">
        ← All sectors
      </Link>

      {/* Hero */}
      <section className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
        <div className="min-w-0">
          <p className="label mb-2">
            {stat.companies} {stat.companies === 1 ? 'company' : 'companies'} in the index
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">
            {stat.sector}
          </h1>
        </div>
        <div className="shrink-0 flex items-end gap-6">
          <div className="text-right">
            <div className="font-mono text-6xl leading-none" style={{ color: BAND_COLORS[bandFor(med)] }}>
              {med}
            </div>
            <p className="label mt-1">median</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-3xl leading-none text-ink-300">{stat.avgScore}</div>
            <p className="label mt-1">average</p>
          </div>
        </div>
      </section>

      {/* Sector score over time */}
      {series.length > 0 && (
        <section>
          <SectionHeading
            kicker="The sector over time"
            title={`Score ${first.year} → ${last.year}`}
          />
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-ink-300">
              median {first.year} <span className="font-mono text-white">{first.median}</span> →{' '}
              {last.year}{' '}
              <span className="font-mono" style={{ color: BAND_COLORS[bandFor(last.median)] }}>
                {last.median}
              </span>
            </span>
            <span className={`font-mono ${changeColor}`}>
              {change === 0 ? '±0' : fmtPts(change)}
            </span>
            <span className="text-ink-500">·</span>
            <span className="text-ink-400">
              best <span className="font-mono">{stat.max}</span> · worst{' '}
              <span className="font-mono">{stat.min}</span>
              {stat.harmfulPlus > 0 && (
                <span> · {stat.harmfulPlus} harmful or worse</span>
              )}
            </span>
          </div>
          <Suspense fallback={<div className="card h-[240px] animate-pulse" />}>
            <SectorTimelineChart data={series} />
          </Suspense>
        </section>
      )}

      {/* Companies in the sector */}
      <section>
        <SectionHeading
          kicker="Everyone in this sector"
          title={`${cs.length} ${cs.length === 1 ? 'company' : 'companies'}`}
        />
        <div className="space-y-2">
          {cs.map((c) => (
            <Link
              key={c.slug}
              to={`/company/${c.slug}`}
              className="card p-3 flex items-center gap-4 hover:border-ink-500 transition-colors"
            >
              <div
                className="font-mono text-2xl w-12 text-right shrink-0"
                style={{ color: BAND_COLORS[c.band] }}
              >
                {c.score}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium truncate">{c.name}</span>
                  {c.ticker && (
                    <span className="font-mono text-[11px] text-ink-500">({c.ticker})</span>
                  )}
                  <BandChip band={c.band} size="sm" />
                </div>
                {c.timelineChange !== null && c.timelineChange !== 0 && (
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    <span
                      className={`font-mono ${c.timelineChange < 0 ? 'text-red-400' : 'text-emerald-400'}`}
                    >
                      {fmtPts(c.timelineChange)}
                    </span>{' '}
                    since {c.timeline[0]?.year}
                    {c.trajectoryShape && <span> · {c.trajectoryShape.toLowerCase()}</span>}
                  </p>
                )}
              </div>
              <div className="hidden sm:block shrink-0">
                <FlagChips flags={c.flags} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
