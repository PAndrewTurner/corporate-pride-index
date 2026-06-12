import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BAND_COLORS, companyBySlug, fmtPts, sectors } from '../lib/data';
import type { ActionRow, Company } from '../lib/types';
import {
  BandChip,
  Citation,
  ConfidenceBadge,
  FlagChips,
  GradientBar,
  SectionHeading,
  TrajectoryBadge,
} from '../components/ui';

const ScoreTimeline = lazy(() => import('../components/ScoreTimeline'));

/* ── Evidence: a single action row ─────────────────────────────────────── */

function ActionCard({ a }: { a: ActionRow }) {
  const positive = a.polarity === 'Positive';
  const color = positive ? '#10b981' : '#ef4444';
  return (
    <div
      className="card p-3 border-l-2"
      style={{ borderLeftColor: color }}
      id={`action-${a.actionId}-${a.year}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-100 leading-snug">{a.description}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
            <span className="font-mono">{a.year}</span>
            <span>{a.tier !== '—' ? a.tier : 'Negative action'}</span>
            <span className="font-mono text-ink-600">{a.actionId}</span>
            {a.postJan2025 && (
              <span className="text-red-400 font-medium uppercase tracking-wide">
                post–Jan 2025
              </span>
            )}
          </div>
          {a.notes && <p className="mt-1.5 text-xs text-ink-300 italic">{a.notes}</p>}
          <div className="mt-1.5">
            <Citation url={a.sourceUrl} type={a.sourceType} />
          </div>
        </div>
        <span className="font-mono text-lg shrink-0" style={{ color }}>
          {fmtPts(a.points)}
        </span>
      </div>
    </div>
  );
}

/* ── The "Why" panel — the centerpiece ─────────────────────────────────── */

function WhyPanel({ c }: { c: Company }) {
  const r = c.rationale;
  if (!r) return null;
  return (
    <section id="why" className="scroll-mt-20">
      <div className="card p-6 sm:p-8 border-ink-600">
        <p className="label mb-3">Why this score</p>
        <p className="font-display text-2xl sm:text-[1.7rem] leading-snug text-white">
          {r.verdict}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <TrajectoryBadge trajectory={r.trajectory} />
          <ConfidenceBadge confidence={r.confidence} />
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4">
            <p className="label text-emerald-400 mb-2">What raised the score</p>
            <p className="text-sm leading-relaxed text-ink-200">{r.driversUp}</p>
            <a
              href="#evidence-positive"
              className="mt-3 inline-block text-xs text-emerald-400/90 hover:underline"
            >
              See the {c.actions.filter((a) => a.polarity === 'Positive').length} sourced positive
              actions ↓
            </a>
          </div>
          <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
            <p className="label text-red-400 mb-2">What lowered it</p>
            <p className="text-sm leading-relaxed text-ink-200">{r.driversDown}</p>
            <a
              href="#evidence-negative"
              className="mt-3 inline-block text-xs text-red-400/90 hover:underline"
            >
              See the {c.actions.filter((a) => a.polarity === 'Negative').length} sourced negative
              actions ↓
            </a>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-band-neutral/30 bg-band-neutral/5 p-4">
          <p className="label text-band-neutral mb-1">What tipped the score</p>
          <p className="text-sm leading-relaxed text-ink-100">{r.decisiveFactor}</p>
          <a href="#evidence" className="mt-2 inline-block text-xs text-sky-400 hover:underline">
            Check the evidence trail ↓
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Sticky mini-header (appears once the hero scrolls out of view) ────── */

function MiniHeader({ c, visible }: { c: Company; visible: boolean }) {
  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 border-b border-ink-700/60 bg-ink-950/95 backdrop-blur transition-transform duration-200 ${
        visible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-12 flex items-center gap-4">
        <Link to="/" className="text-xs text-ink-400 hover:text-white shrink-0">
          ← Index
        </Link>
        <span className="font-display text-lg text-white truncate">{c.name}</span>
        <span className="ml-auto flex items-center gap-3 shrink-0">
          <span className="font-mono text-xl" style={{ color: BAND_COLORS[c.band] }}>
            {c.score}
          </span>
          <BandChip band={c.band} size="sm" />
        </span>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function CompanyPage() {
  const { slug } = useParams();
  const c = slug ? companyBySlug.get(slug) : undefined;

  const heroRef = useRef<HTMLDivElement>(null);
  const [miniVisible, setMiniVisible] = useState(false);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(([e]) => setMiniVisible(!e.isIntersecting), {
      rootMargin: '-60px 0px 0px 0px',
    });
    obs.observe(hero);
    return () => obs.disconnect();
  }, [slug]);

  if (!c) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-white">Company not found</h1>
        <Link to="/" className="text-sky-400 hover:underline text-sm mt-3 inline-block">
          ← Back to the index
        </Link>
      </div>
    );
  }

  const positives = c.actions.filter((a) => a.polarity === 'Positive');
  const negatives = c.actions.filter((a) => a.polarity === 'Negative');
  const sectorStats = sectors.find((s) => s.sector === c.sector);
  const b = c.breakdown;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-10">
      <MiniHeader c={c} visible={miniVisible} />

      <Link to="/" className="text-xs text-ink-400 hover:text-white">
        ← Index
      </Link>

      {/* Hero */}
      <section ref={heroRef} className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
        <div className="min-w-0">
          <p className="label mb-2">
            {c.sector}
            {c.ticker && <span className="ml-2 font-mono normal-case">({c.ticker})</span>}
            {c.revenueB && (
              <span className="ml-2 font-mono normal-case">${c.revenueB}B revenue</span>
            )}
          </p>
          <h1 className="font-display text-5xl text-white leading-none">{c.name}</h1>
          <div className="mt-4">
            <FlagChips flags={c.flags} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div
            className="font-mono text-7xl leading-none"
            style={{ color: BAND_COLORS[c.band] }}
          >
            {c.score}
          </div>
          <div className="mt-2 flex justify-end">
            <BandChip band={c.band} size="lg" />
          </div>
        </div>
      </section>

      <GradientBar
        score={c.score}
        showLabels
        markers={sectorStats ? [{ score: sectorStats.avgScore, label: `${c.sector} average` }] : []}
      />

      {/* THE WHY — before anything else */}
      <WhyPanel c={c} />

      {/* Score timeline */}
      {c.timeline.length > 0 && (
        <section id="timeline" className="scroll-mt-20">
          <SectionHeading
            kicker="How the score moved, and why"
            title={`Score timeline ${c.timeline[0].year} → ${c.timeline[c.timeline.length - 1].year}`}
          />
          <Suspense fallback={<div className="card h-[220px] animate-pulse" />}>
            <ScoreTimeline c={c} />
          </Suspense>
        </section>
      )}

      {/* Scoring breakdown */}
      <section id="evidence" className="scroll-mt-20">
        <SectionHeading
          kicker="The evidence behind the reasoning"
          title="Full scoring breakdown"
        />
        <div className="card p-4 mb-6 overflow-x-auto">
          <table className="font-mono text-sm w-full min-w-[540px]">
            <tbody>
              <tr className="text-ink-300">
                <td className="py-1 pr-4">Baseline</td>
                <td className="text-right text-white">50</td>
                <td className="pl-6 text-xs text-ink-400">every company starts neutral</td>
              </tr>
              <tr className="text-ink-300">
                <td className="py-1 pr-4">Cosmetic + Commercial (capped at +20)</td>
                <td className="text-right text-emerald-400">
                  +{b.cosmeticCommercialCapped}
                  {b.cosmeticCommercialRaw > b.cosmeticCommercialCapped && (
                    <span className="text-ink-400 text-xs"> (raw +{b.cosmeticCommercialRaw})</span>
                  )}
                </td>
                <td className="pl-6 text-xs text-ink-400">rainbow-washing cap applied</td>
              </tr>
              <tr className="text-ink-300">
                <td className="py-1 pr-4">Civic</td>
                <td className="text-right text-emerald-400">+{b.civic}</td>
                <td />
              </tr>
              <tr className="text-ink-300">
                <td className="py-1 pr-4">Financial</td>
                <td className="text-right text-emerald-400">+{b.financial}</td>
                <td />
              </tr>
              <tr className="text-ink-300">
                <td className="py-1 pr-4">Structural</td>
                <td className="text-right text-emerald-400">+{b.structural}</td>
                <td className="pl-6 text-xs text-ink-400">hardest to fake, hardest to reverse</td>
              </tr>
              <tr className="text-ink-300">
                <td className="py-1 pr-4">Negative actions (uncapped)</td>
                <td className="text-right text-red-400">{b.negative}</td>
                <td className="pl-6 text-xs text-ink-400">reversal asymmetry by design</td>
              </tr>
              <tr className="border-t border-ink-700 text-white">
                <td className="py-1.5 pr-4 font-medium">Final score (clamped 0–100)</td>
                <td className="text-right text-lg" style={{ color: BAND_COLORS[c.band] }}>
                  {c.score}
                </td>
                <td className="pl-6 text-xs text-ink-400">
                  recomputed from the rows below at build time
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {c.actions.length === 0 ? (
          <p className="text-sm text-ink-300 card p-4">
            No public pro- or anti-LGBTQ+ actions met the index's sourcing bar for this company.
            It holds the neutral baseline of 50 by absence of evidence, not by virtue.
          </p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div id="evidence-positive" className="scroll-mt-20 space-y-2">
              <p className="label text-emerald-400">
                Positive actions · {positives.length} · +{b.positiveCapped} pts after cap
              </p>
              {positives.map((a, i) => (
                <ActionCard key={i} a={a} />
              ))}
              {positives.length === 0 && (
                <p className="text-sm text-ink-400 card p-3">None on record.</p>
              )}
            </div>
            <div id="evidence-negative" className="scroll-mt-20 space-y-2">
              <p className="label text-red-400">
                Negative actions · {negatives.length} · {b.negative || 0} pts
              </p>
              {negatives.map((a, i) => (
                <ActionCard key={i} a={a} />
              ))}
              {negatives.length === 0 && (
                <p className="text-sm text-ink-400 card p-3">None on record.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Statements */}
      {c.statements.length > 0 && (
        <section id="statements" className="scroll-mt-20">
          <SectionHeading kicker="In their own words" title="Statements & reports" />
          <div className="space-y-3">
            {c.statements.map((s, i) => (
              <figure key={i} className="card p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400 mb-2">
                  <span className="uppercase tracking-wider font-medium text-ink-300">
                    {s.recordType}
                  </span>
                  {s.date && <span className="font-mono">{s.date}</span>}
                  <span>{s.title}</span>
                </div>
                <blockquote className="border-l-2 border-ink-600 pl-4 text-[15px] leading-relaxed text-ink-100 font-display">
                  {s.excerpt}
                </blockquote>
                <figcaption className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                  {s.speaker && <span>— {s.speaker}</span>}
                  <Citation url={s.sourceUrl} />
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Social feed */}
      {c.social.length > 0 && (
        <section id="social" className="scroll-mt-20">
          <SectionHeading kicker="The public record" title="Pride-related social activity" />
          <div className="space-y-2">
            {c.social.map((p, i) => (
              <div
                key={i}
                className={`card p-3 flex items-start justify-between gap-3 ${
                  p.deleted ? 'opacity-80 border-red-900/60' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
                    <span className="text-ink-200 font-medium">{p.platform}</span>
                    {p.date && <span className="font-mono">{p.date}</span>}
                    {p.deleted && (
                      <span className="text-red-400 font-medium uppercase tracking-wide">
                        ✕ later deleted
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm text-ink-100 ${p.deleted ? 'line-through decoration-red-500/60 decoration-1' : ''}`}>
                    {p.description}
                  </p>
                  {p.notes && <p className="mt-1 text-xs text-ink-300 italic">{p.notes}</p>}
                  <div className="mt-1.5">
                    <Citation url={p.url} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HRC CEI cross-reference */}
      <section>
        <SectionHeading kicker="Cross-reference" title="HRC Corporate Equality Index" />
        <div className="card p-4 text-sm text-ink-200 leading-relaxed">
          {c.hrcCei !== null ? (
            <>
              <p>
                HRC CEI score:{' '}
                <span className="font-mono text-white text-base">{c.hrcCei}/100</span>
                {c.ceiYear && <span className="text-ink-400 font-mono"> ({c.ceiYear})</span>}.
              </p>
              {c.stillSubmittingCei === false && (
                <p className="mt-2 rounded border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2">
                  ⚑ {c.name} has <strong>stopped submitting</strong> to the HRC Corporate Equality
                  Index — its last score ({c.hrcCei}, {c.ceiYear}) no longer reflects current
                  policy and should be read as historical, not current.
                </p>
              )}
              {c.stillSubmittingCei && (
                <p className="mt-1 text-ink-400 text-xs">Still participating in the CEI.</p>
              )}
            </>
          ) : (
            <p>No HRC CEI score on record for this company.</p>
          )}
        </div>
      </section>

      {/* Analyst notes */}
      {c.analystNotes && (
        <section>
          <SectionHeading kicker="Context" title="Analyst notes" />
          <p className="card p-4 text-sm leading-relaxed text-ink-200">{c.analystNotes}</p>
        </section>
      )}

      <div className="pt-2 flex gap-4">
        <Link
          to={`/compare?c=${c.slug}`}
          className="text-sm text-sky-400 hover:underline"
        >
          Compare {c.name} against its peers →
        </Link>
        <Link to="/methodology" className="text-sm text-ink-400 hover:text-white">
          How scoring works
        </Link>
      </div>
    </div>
  );
}
