import { BAND_COLORS, companies } from '../lib/data';
import type { FilterEventDetail } from './DashboardTable';

/* ── Stat card ─────────────────────────────────────────────────────────── */

function Stat({
  value,
  label,
  accent,
  onClick,
}: {
  value: string;
  label: string;
  accent?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="font-mono text-2xl text-white" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="label mt-1">
        {label}
        {onClick && <span className="ml-1 normal-case text-ink-600">→ filter</span>}
      </div>
    </>
  );
  if (onClick)
    return (
      <button
        onClick={onClick}
        className="card px-4 py-3 text-left hover:border-ink-400 transition-colors cursor-pointer"
      >
        {inner}
      </button>
    );
  return <div className="card px-4 py-3">{inner}</div>;
}

/**
 * The four headline stat cards. Island (client:load). The two clickable cards
 * filter the master-table island (which is rendered separately, after the
 * charts) by dispatching a `cpi:filter` CustomEvent, then scroll to it.
 */
export default function DashboardStats() {
  const filterTable = (detail: FilterEventDetail) => {
    window.dispatchEvent(new CustomEvent('cpi:filter', { detail }));
    document.getElementById('master-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat value={String(companies.length)} label="companies scored" />
      <Stat
        value={String(companies.filter((c) => c.flags.postJan2025Reversal).length)}
        label="post–Jan 2025 reversals"
        accent={BAND_COLORS.Harmful}
        onClick={() => filterTable({ band: '', flags: ['postJan2025Reversal'] })}
      />
      <Stat
        value={String(companies.filter((c) => c.band === 'Champion').length)}
        label="champions (80+)"
        accent={BAND_COLORS.Champion}
        onClick={() => filterTable({ band: 'Champion', flags: [] })}
      />
      <Stat
        value={(companies.reduce((s, c) => s + c.score, 0) / companies.length).toFixed(1)}
        label="index average"
      />
    </section>
  );
}
