import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import CompanyPage from './pages/CompanyPage';
import Compare from './pages/Compare';
import Methodology from './pages/Methodology';
import { data } from './lib/data';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded text-sm transition-colors ${
    isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white'
  }`;

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between py-2 min-h-14">
          <div>
            <NavLink to="/" className="flex items-baseline gap-3 group">
              <span className="font-display text-xl text-white tracking-wide">
                The Corporate Pride Index
              </span>
              <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-ink-400">
                Accountability, not applause
              </span>
            </NavLink>
            <a
              href="https://www.anthropic.com/claude"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-400 hover:text-ink-200 transition-colors w-fit"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-2.5 h-2.5 shrink-0 text-[#d97757]"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 1.5c.6 4.9 1.4 7.2 3.4 9.1 2 1.9 4.3 2.7 7.1 3.4-2.8.7-5.1 1.5-7.1 3.4-2 1.9-2.8 4.2-3.4 9.1-.6-4.9-1.4-7.2-3.4-9.1-2-1.9-4.3-2.7-7.1-3.4 2.8-.7 5.1-1.5 7.1-3.4 2-1.9 2.8-4.2 3.4-9.1Z" />
              </svg>
              Built with Claude Fable 5, Anthropic's latest model
            </a>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLink}>
              Index
            </NavLink>
            <NavLink to="/compare" className={navLink}>
              Compare
            </NavLink>
            <NavLink to="/methodology" className={navLink}>
              Methodology
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/company/:slug" element={<CompanyPage />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/methodology" element={<Methodology />} />
        </Routes>
      </main>

      <footer className="border-t border-ink-700/60 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-xs text-ink-400 space-y-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 justify-between">
            <p>
              {data.companies.length} companies · {data.validation.actionsChecked} sourced actions
              · every score independently recomputed from its evidence at build time
              {data.validation.passed ? ' — validation passed.' : ' — VALIDATION FAILED.'}
            </p>
            <p>
              Data generated {new Date(data.generatedAt).toISOString().slice(0, 10)} from{' '}
              <span className="font-mono">{data.workbook}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-ink-800">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 shrink-0 text-[#d97757]"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 1.5c.6 4.9 1.4 7.2 3.4 9.1 2 1.9 4.3 2.7 7.1 3.4-2.8.7-5.1 1.5-7.1 3.4-2 1.9-2.8 4.2-3.4 9.1-.6-4.9-1.4-7.2-3.4-9.1-2-1.9-4.3-2.7-7.1-3.4 2.8-.7 5.1-1.5 7.1-3.4 2-1.9 2.8-4.2 3.4-9.1Z" />
            </svg>
            <p>
              Built with the assistance of{' '}
              <a
                href="https://www.anthropic.com/claude"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-300 hover:text-white underline decoration-ink-600 underline-offset-2"
              >
                Claude Fable 5
              </a>
              , Anthropic's latest model — data ingestion, scoring validation, and site design.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
