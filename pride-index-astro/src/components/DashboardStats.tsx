import { companies } from '../lib/data';
import type { FilterEventDetail } from './DashboardTable';

/** The four headline stat cards (v2 .stats/.tile). Island (client:load).
 *  The two clickable cards filter the master-table island via a `cpi:filter`
 *  CustomEvent, then scroll to it. */
export default function DashboardStats() {
  const total = companies.length;
  const reversals = companies.filter((c) => c.flags.postJan2025Reversal).length;
  const champions = companies.filter((c) => c.band === 'Champion').length;
  const avg = (companies.reduce((s, c) => s + c.score, 0) / total).toFixed(1);

  const filterTable = (detail: FilterEventDetail) => {
    window.dispatchEvent(new CustomEvent('cpi:filter', { detail }));
    document.getElementById('master-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="stats">
      <div className="tile">
        <div className="num">{total}</div>
        <div className="cap">companies scored</div>
      </div>
      <button className="tile red" onClick={() => filterTable({ band: '', flags: ['postJan2025Reversal'] })}>
        <div className="spark" />
        <div className="num">{reversals}</div>
        <div className="cap">post–Jan 2025 reversals → filter</div>
      </button>
      <button className="tile green" onClick={() => filterTable({ band: 'Champion', flags: [] })}>
        <div className="spark" />
        <div className="num">{champions}</div>
        <div className="cap">champions · 80+ → filter</div>
      </button>
      <div className="tile">
        <div className="num">{avg}</div>
        <div className="cap">index average</div>
      </div>
    </section>
  );
}
