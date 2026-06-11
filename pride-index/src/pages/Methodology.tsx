import { Link } from 'react-router-dom';
import { BAND_COLORS, companyBySlug, data, fmtPts, scoringReference } from '../lib/data';
import { BAND_THRESHOLDS, computeScore } from '../lib/scoring';
import { BandChip, GradientBar, SectionHeading } from '../components/ui';

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 text-[15px] leading-relaxed text-ink-200">{children}</div>;
}

export default function Methodology() {
  const verizon = companyBySlug.get('verizon');
  const vz = verizon ? computeScore(verizon.actions) : null;

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
        <SectionHeading kicker="The worked example" title="The Verizon standard" />
        <Prose>
          <p>
            Verizon is the reference case for the whole index. For years it did what looked like
            allyship: annual rainbow branding, Pride statements, parade sponsorships, a funded
            LGBTQ+ employee resource group. Then in May 2025, with a merger pending before the
            FCC, it told the regulator in writing that it would end its DEI commitments —
            policies, language, programs.
          </p>
          <p>
            A model that simply averaged its history would call Verizon mildly positive. This
            model doesn't, and the arithmetic shows why:
          </p>
        </Prose>
        {vz && verizon && (
          <div className="card p-4 my-4 font-mono text-sm overflow-x-auto">
            <table className="w-full min-w-[460px]">
              <tbody className="text-ink-300">
                <tr>
                  <td className="py-1">Baseline</td>
                  <td className="text-right text-white">50</td>
                </tr>
                <tr>
                  <td className="py-1">
                    Cosmetic + Commercial (raw +{vz.cosmeticCommercialRaw}, cap 20)
                  </td>
                  <td className="text-right text-emerald-400">+{vz.cosmeticCommercialCapped}</td>
                </tr>
                <tr>
                  <td className="py-1">Civic (parade sponsorship, ERG)</td>
                  <td className="text-right text-emerald-400">+{vz.civic}</td>
                </tr>
                <tr>
                  <td className="py-1">Financial / Structural</td>
                  <td className="text-right text-emerald-400">
                    +{vz.financial + vz.structural}
                  </td>
                </tr>
                <tr>
                  <td className="py-1">2025 reversal (DEI removal, Pride retreat, rollbacks)</td>
                  <td className="text-right text-red-400">{vz.negative}</td>
                </tr>
                <tr className="border-t border-ink-700 text-white">
                  <td className="py-1.5 font-medium">Score</td>
                  <td className="text-right text-lg" style={{ color: BAND_COLORS[vz.band] }}>
                    {vz.score} · {vz.band}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <Prose>
          <p>
            Years of visible support, and it lands at{' '}
            <strong style={{ color: vz ? BAND_COLORS[vz.band] : undefined }}>
              {vz?.score} — {vz?.band}
            </strong>
            . That is the Verizon standard: support that evaporates the moment it has a price
            wasn't support. It was marketing with a long lead time.{' '}
            <Link to="/company/verizon" className="text-sky-400 hover:underline">
              See the full evidence trail →
            </Link>
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
