import { Link } from 'react-router-dom';
import { BAND_COLORS, companyBySlug, data, fmtPts, scoringReference } from '../lib/data';
import { BAND_THRESHOLDS, computeScore } from '../lib/scoring';
import { BandChip, GradientBar, SectionHeading } from '../components/ui';

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 text-[15px] leading-relaxed text-ink-200">{children}</div>;
}

const EXAMPLES: { slug: string; lesson: string }[] = [
  {
    slug: 'apple',
    lesson:
      'Sustained structural commitment — benefits, policy, a long consistent record — pushes far past the cosmetic cap and held publicly through the 2025 backlash. Structure is what the formula rewards most.',
  },
  {
    slug: 'verizon',
    lesson:
      'Years of visible support — branding, sponsorships, a funded ERG — erased by a written 2025 reversal under regulatory pressure. Support that evaporates when it carries a cost is scored as what the evaporation reveals.',
  },
  {
    slug: 'salesforce',
    lesson:
      'A reversal hurts even an ally: real negative points for sanding the public edges off its commitments. But deep structural investment absorbs the blow — the score drops without collapsing.',
  },
  {
    slug: 'tesla',
    lesson:
      'Nothing positive on the record and documented negative actions: the baseline offers no shelter. With no support to lose, negative points fall straight through to the bottom band.',
  },
];

export default function Methodology() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-12">
      <header>
        <p className="label mb-2">Built for public scrutiny</p>
        <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">Methodology</h1>
        <p className="mt-4 text-ink-300 leading-relaxed">
          This index exists to answer one question: when a company puts a rainbow on its logo, is
          there anything underneath? You should never have to trust our judgment — every number on
          this site is recomputed from sourced, public actions each time the site is built, and
          every action carries its citation.
        </p>
      </header>

      <section>
        <SectionHeading kicker="The framework" title="How a score is built" />
        <Prose>
          <p>
            Every company starts at <strong className="font-mono text-white">50</strong> — neutral.
            Nothing is owed; nothing is presumed. From there, documented actions move the score in
            five positive tiers and one uncapped negative category:
          </p>
        </Prose>
        <div className="card p-4 my-4 font-mono text-sm overflow-x-auto">
          <pre className="text-ink-200 whitespace-pre">
{`score = clamp( 50                                  // neutral baseline
       + min(20, cosmetic + commercial)    // the rainbow-washing cap
       + civic + financial + structural    // substance, uncapped
       + negative,                         // harm, uncapped
       0, 100 )`}
          </pre>
        </div>
        <Prose>
          <p>
            <strong className="text-white">The +20 cosmetic cap.</strong> Rainbow logos, Pride
            posts, and merchandise collections are real but cheap. No volume of branding can
            contribute more than 20 points — a company cannot post its way into being an ally. To
            score above the Neutral band, it must spend, show up, or change policy.
          </p>
          <p>
            <strong className="text-white">Reversal asymmetry.</strong> Negative actions are
            uncapped and individually heavier than their positive counterparts (lobbying against
            LGBTQ+ legislation costs −40; an explicit pro-LGBTQ+ DEI policy earns +20). This is
            deliberate. Adopting a policy under sunny conditions is weak evidence of commitment;
            abandoning one under pressure is strong evidence of its absence. A reversal doesn't
            just subtract recent points — it retroactively reveals what the earlier support was
            made of.
          </p>
        </Prose>
      </section>

      <section>
        <SectionHeading kicker="Reading the number" title="The six bands" />
        <div className="mb-4">
          <GradientBar height={10} showLabels />
        </div>
        <div className="card divide-y divide-ink-800">
          {BAND_THRESHOLDS.map((b) => (
            <div key={b.band} className="flex items-center justify-between px-4 py-2.5">
              <BandChip band={b.band} />
              <span className="font-mono text-sm" style={{ color: BAND_COLORS[b.band] }}>
                {b.min}–{b.max}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-300 leading-relaxed">
          The rainbow appears on this site in exactly one place: the 0–100 score gradient. It is
          not decoration — it is the measurement scale itself.
        </p>
      </section>

      <section>
        <SectionHeading kicker="The framework in practice" title="Worked examples" />
        <Prose>
          <p>
            Four companies, four patterns the formula is built to distinguish. Each breakdown
            below is computed live from the company's logged actions — the same arithmetic that
            produces every score on this site.
          </p>
        </Prose>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          {EXAMPLES.map(({ slug, lesson }) => {
            const ex = companyBySlug.get(slug);
            if (!ex) return null;
            const b = computeScore(ex.actions);
            return (
              <div key={slug} className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to={`/company/${slug}`}
                    className="font-display text-xl text-white hover:underline"
                  >
                    {ex.name}
                  </Link>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-2xl" style={{ color: BAND_COLORS[b.band] }}>
                      {b.score}
                    </span>
                    <BandChip band={b.band} size="sm" />
                  </span>
                </div>
                <table className="font-mono text-xs w-full">
                  <tbody className="text-ink-300">
                    <tr>
                      <td className="py-0.5">Baseline</td>
                      <td className="text-right text-white">50</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">
                        Cosmetic+Commercial
                        {b.cosmeticCommercialRaw > b.cosmeticCommercialCapped
                          ? ` (raw +${b.cosmeticCommercialRaw}, capped)`
                          : ''}
                      </td>
                      <td className="text-right text-emerald-400">
                        +{b.cosmeticCommercialCapped}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Civic + Financial + Structural</td>
                      <td className="text-right text-emerald-400">
                        +{b.civic + b.financial + b.structural}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Negative actions</td>
                      <td className="text-right text-red-400">{b.negative}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs leading-relaxed text-ink-300">{lesson}</p>
              </div>
            );
          })}
        </div>
        <Prose>
          <p className="text-sm text-ink-300">
            The common thread: the formula doesn't average a company's history — it asks what the
            record proves. Branding without substance stalls at the cap; structure survives
            pressure; and support that evaporates the moment it carries a cost is scored as what
            the evaporation reveals it to have been.
          </p>
        </Prose>
      </section>

      <section>
        <SectionHeading kicker="The point values" title="Full scoring reference" />
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="border-b border-ink-700/60">
              <tr>
                <th className="label text-left px-3 py-2">Action ID</th>
                <th className="label text-left px-3 py-2">Tier</th>
                <th className="label text-right px-3 py-2">Points</th>
                <th className="label text-left px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {scoringReference.map((r) => (
                <tr key={r.actionId} className="border-b border-ink-800 last:border-0">
                  <td className="px-3 py-1.5 font-mono text-xs text-ink-400">{r.actionId}</td>
                  <td className="px-3 py-1.5 text-ink-300 text-xs">{r.tier}</td>
                  <td
                    className={`px-3 py-1.5 text-right font-mono ${
                      r.points > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {fmtPts(r.points)}
                  </td>
                  <td className="px-3 py-1.5 text-ink-200">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionHeading kicker="Why you can check us" title="Sourcing standards" />
        <Prose>
          <p>
            Every action in the index — all {data.validation.actionsChecked} of them — is a
            discrete, dated, publicly documented event with a source URL attached: news reporting,
            company press releases and filings, archived web pages, or the HRC Corporate Equality
            Index. Where companies deleted the evidence (Pride posts, DEI pages), we cite archives
            and reporting on the deletion — the deletion itself is part of the record.
          </p>
          <p>
            Each company page also carries a one-line verdict, the drivers in both directions, and
            the decisive factor, written by the analyst — but the prose never moves the number.
            Only logged actions do.
          </p>
          <p>
            At build time the site recomputes every score from raw actions with the formula above
            and asserts it matches the workbook's own formula, and verifies every action's point
            value against the fixed scoring reference. This build:{' '}
            <strong className={data.validation.passed ? 'text-emerald-400' : 'text-red-400'}>
              {data.validation.passed
                ? `all ${data.validation.companiesChecked} companies validated ✓`
                : 'VALIDATION FAILED'}
            </strong>
            .
          </p>
          <p>
            Five context flags (post–Jan 2025 reversal, pressure-driven, June-only, trans/NB
            exclusion, geographic hypocrisy) mark patterns that numbers alone can miss. They never
            change a score; they tell you how to read it.
          </p>
          <p className="text-ink-400 text-sm">
            Disagree with a point value or think we missed an action? Good — that's the point of
            publishing the rubric. Every input is inspectable, so the argument can be about
            evidence, not vibes.
          </p>
        </Prose>
      </section>
    </div>
  );
}
