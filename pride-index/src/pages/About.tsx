import { Link } from 'react-router-dom';
import { companies } from '../lib/data';
import { SectionHeading } from '../components/ui';

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 text-[15px] leading-relaxed text-ink-200">{children}</div>;
}

const ext = 'text-sky-400 hover:underline';

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-12">
      <header>
        <p className="label mb-2">The project and the person behind it</p>
        <h1 className="font-display text-4xl sm:text-5xl text-white leading-tight">About</h1>
      </header>

      {/* ── About the Project ─────────────────────────────────────────── */}
      <section id="project" className="scroll-mt-20">
        <SectionHeading kicker="About the project" title="The Corporate Pride Index" />
        <Prose>
          <p>
            The Corporate Pride Index tracks whether major American companies actually stand
            behind the LGBTQ+ community — or simply market to it.
          </p>
          <p>
            Over the past decade, rainbow logos and Pride merchandise became standard corporate
            fare every June. But commitments made in good times reveal little; what matters is
            what happens under pressure. Beginning around 2022, and accelerating sharply after
            the second Trump inauguration on January 20, 2025, organized anti-LGBTQ+ campaigns
            tested those commitments directly. Some companies held their ground. Many others
            retreated — quietly pulling Pride merchandise, deleting DEI policies, and scrubbing
            inclusive language from their own mission statements.
          </p>
          <p>This index exists to document that record, company by company, with sources.</p>
        </Prose>

        <h3 className="font-display text-xl text-white mt-8 mb-3">How it works</h3>
        <Prose>
          <p>
            Each of {companies.length} major companies starts from a neutral baseline and is
            scored using a transparent point system based on documented actions: financial
            donations to LGBTQ+ organizations, sponsorships, employee resource groups, policy
            language, political donations, lobbying, and more. Positive actions raise a company's
            score; negative actions lower it.
          </p>
          <p>
            Critically, <strong className="text-white">reversals count more than absence</strong>.
            A company that publicly supported the LGBTQ+ community and then rolled back that
            support under political or commercial pressure scores worse than a company that never
            made the commitment in the first place — because the reversal demonstrates the
            original support was never principled. Tracking these reversals, and the pressure
            behind them, is the central purpose of this project.
          </p>
          <p>
            Each company's score comes with a written rationale explaining what drove it up, what
            drove it down, the single decisive factor, and where the company's trajectory appears
            to be headed — improving, stable, declining, or in sharp reversal.
          </p>
        </Prose>

        <h3 className="font-display text-xl text-white mt-8 mb-3">Sourcing</h3>
        <Prose>
          <p>
            Every claim in the index is tied to a public source: HRC Corporate Equality Index
            reports, GLAAD corporate accountability reports, company press releases and ESG
            disclosures, FEC and OpenSecrets campaign-finance records, established news
            reporting, and — where companies have deleted or altered their own public statements
            — archived versions captured via the Wayback Machine.
          </p>
          <p>
            This project is independent and non-commercial. Its goal is simple: give people the
            information to know which companies' support for the LGBTQ+ community is real, and
            which was only ever a marketing campaign.
          </p>
          <p>
            <Link to="/methodology" className={ext}>
              Read the full scoring methodology →
            </Link>
          </p>
        </Prose>
      </section>

      {/* ── About the Author ──────────────────────────────────────────── */}
      <section id="author" className="scroll-mt-20">
        <SectionHeading kicker="About the author" title="Paul Andrew Turner Jr." />
        <div className="sm:flex sm:gap-6 sm:items-start">
          <img
            src={`${import.meta.env.BASE_URL}headshot.jpg`}
            alt="Portrait of Paul Andrew Turner Jr."
            className="w-40 h-40 sm:w-44 sm:h-44 shrink-0 rounded-full object-cover border border-ink-700/60 mb-4 sm:mb-0"
            style={{ objectPosition: '50% 20%' }}
          />
          <Prose>
            <p>
              <strong className="text-white">Paul Andrew Turner Jr.</strong> is an Orlando-based
              data scientist and finance professional who built the Corporate Pride Index as an
              independent research project leveraging new advanced AI models for data collection,
              research, analysis, and production. He is an openly gay man and active member of
              the Orlando LGBTQ+ community.
            </p>
            <p>
              By day, Andrew works as a corporate financial consultant in FP&amp;A at a Fortune
              50 company, where he builds forecasting models, machine learning pipelines, and
              executive reporting, and helps lead the adoption of GenAI tools like Claude and
              Gemini within his team.
            </p>
          </Prose>
        </div>
        <div className="mt-3">
          <Prose>
            <p>
              His academic background spans law, finance, and data science: a Master of Arts in
              Economics at the University of Florida, concentrating in econometrics and data
              analysis, a Juris Master in Financial Regulation &amp; Compliance Law from the
              Florida State University College of Law, a Master of Science in Financial
              Technology from the University of Central Florida, and a Bachelor of Science in
              Statistics (with a minor in Computer Science).
            </p>
            <p>
              The Corporate Pride Index draws on this combination of skills — rigorous sourcing
              and data structuring, statistical scoring methodology, and an understanding of
              corporate and regulatory behavior — to build a transparent, evidence-based record
              of how major American companies have actually treated the LGBTQ+ community,
              particularly through the political pressures of 2025 and beyond.
            </p>
            <p>
              Outside of this project, Andrew writes about finance, data, and regulation on{' '}
              <a
                href="https://pandrewturner.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                className={ext}
              >
                Substack
              </a>
              , and shares more about his work and research on his{' '}
              <a
                href="https://pandrewturner.github.io/Andrews-Personal-Website/"
                target="_blank"
                rel="noopener noreferrer"
                className={ext}
              >
                personal website
              </a>
              .
            </p>
          </Prose>
        </div>
        <div className="card mt-6 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="label">Contact</span>
          <a href="mailto:CorpPrideIndex@outlook.com" className={ext}>
            CorpPrideIndex@outlook.com
          </a>
          <a
            href="https://www.linkedin.com/in/pandrewturner/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            LinkedIn
          </a>
        </div>
      </section>
    </div>
  );
}
