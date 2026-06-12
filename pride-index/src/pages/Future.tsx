import { Link } from 'react-router-dom';
import { SectionHeading } from '../components/ui';

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 text-[15px] leading-relaxed text-ink-200">{children}</div>;
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-display text-xl text-white mb-2">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-ink-300">{children}</div>
    </div>
  );
}

export default function Future() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-12">
      <header>
        <p className="label mb-2">Where the index is headed</p>
        <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">
          Future Enhancements
        </h1>
        <p className="mt-4 text-ink-300 leading-relaxed">
          The Corporate Pride Index is an active project. These are the planned additions — listed
          publicly for the same reason the scoring rubric is published: so the project can be held
          to its own standards. None of these are live yet; the current index is exactly what the{' '}
          <Link to="/methodology" className="text-sky-400 hover:underline">
            methodology
          </Link>{' '}
          describes.
        </p>
      </header>

      <section>
        <SectionHeading
          kicker="Community accountability"
          title="Public submissions &amp; evidence reporting"
        />
        <div className="space-y-4 mt-4">
          <Item title="User-submitted evidence">
            <p>
              Anyone will be able to report a documented company action — positive or negative —
              for inclusion in the index. Every submission requires a source, and submitters
              classify what kind of source it is. Rate limits (one submission per company per
              person per day) and per-company caps on pending submissions prevent coordinated
              flooding during news cycles.
            </p>
          </Item>
          <Item title="Tiered evidence verification — the 95% confidence gate">
            <p>
              Not all proof is equal, so different types of evidence carry different weight.
              Public filings such as SEC and FEC records are accepted once verified against the
              official source. News reporting from established outlets requires corroboration.
              Social media posts and statements — which can be faked or AI-generated — require the
              most additional verification.
            </p>
            <p>
              Each submission is evaluated against the evidence already in the index and
              independently researched. Only submissions that clear a 95% confidence threshold
              advance. Removing or correcting an existing entry carries an even higher bar than
              adding a new one, because removal is more gameable than addition.
            </p>
          </Item>
          <Item title="AI-assisted review, human-approved">
            <p>
              High-reasoning Claude models (extended thinking) perform the initial confidence
              analysis: fetching sources, cross-referencing the existing action log, checking for
              contradicting reports, and producing a structured confidence report with full
              reasoning. Submissions that pass are then queued for human analysis and final
              approval. Nothing enters the index without a human sign-off, and every approved
              entry becomes a normal sourced row in the action log — recomputed and validated at
              build time like everything else.
            </p>
          </Item>
          <Item title="Company self-submission &amp; appeals">
            <p>
              Companies and brands will be able to submit themselves to the index, submit evidence
              on their own behalf, or appeal a score they believe is wrong — for example, an
              action that was reported at the time but later corrected. Self-submissions meet the
              same 95% bar as everyone else, and the math stays the math: one good deed does not
              cancel out twenty bad ones. A verified correction doesn't erase the original record;
              it adds the correction to it, with both sides cited.
            </p>
          </Item>
        </div>
      </section>

      <section>
        <SectionHeading kicker="Deeper data" title="Expanding the instrument" />
        <div className="space-y-4 mt-4">
          <Item title="Expanded company universe">
            <p>
              Broader coverage beyond the current major-company set: mid-cap companies, private
              companies with significant public footprints, and non-U.S. multinationals operating
              in the American market.
            </p>
          </Item>
          <Item title="Temporal score tracking">
            <p>
              Year-over-year score history for every company, turning trajectory from a
              qualitative label (improving, stable, declining, sharp reversal) into a quantitative
              record you can chart.
            </p>
          </Item>
          <Item title="Legislative mapping">
            <p>
              Linking negative political donations and lobbying actions to the specific bills they
              supported and what happened to those bills — connecting corporate money to
              legislative outcomes.
            </p>
          </Item>
          <Item title="Sector benchmarking tools">
            <p>
              Richer peer-comparison views showing where a company stands relative to its
              industry, beyond the current sector averages.
            </p>
          </Item>
        </div>
      </section>

      <section>
        <Prose>
          <p className="text-ink-400 text-sm">
            Have feedback on what should come first — or evidence the index should already
            include? Reach out via the{' '}
            <Link to="/about" className="text-sky-400 hover:underline">
              About page
            </Link>
            .
          </p>
        </Prose>
      </section>
    </div>
  );
}
