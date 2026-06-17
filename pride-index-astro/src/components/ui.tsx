import type { Band, Company, Trajectory } from '../lib/types';
import { BAND_COLORS, FLAG_LABELS } from '../lib/data';

/* Shared presentational components, styled with the v2 "Refined Dark Luxe"
   class system (see global.css). Rendered to static HTML by Astro. */

/* ── Band chip ─────────────────────────────────────────────────────────── */
export function BandChip({ band }: { band: Band; size?: 'sm' | 'md' | 'lg' }) {
  const c = BAND_COLORS[band];
  return (
    <span className="bandpill" style={{ color: c, background: c + '1f' }}>
      <i style={{ background: c }} />
      {band}
    </span>
  );
}

/* ── 0–100 rainbow measurement bar ─────────────────────────────────────── */
export function GradientBar({
  score,
  showLabels = false,
  markers = [],
}: {
  score?: number;
  height?: number;
  showLabels?: boolean;
  markers?: { score: number; label: string }[];
}) {
  return (
    <div>
      <div className="gradbar">
        {score !== undefined && <span className="mk" style={{ left: `${score}%` }} />}
        {markers.map((m) => (
          <span key={m.label} className="avg" style={{ left: `${m.score}%` }} title={`${m.label}: ${m.score}`} />
        ))}
      </div>
      {showLabels && (
        <div className="gradends">
          <span>0 · Adversarial</span>
          <span>50 · Neutral</span>
          <span>100 · Champion</span>
        </div>
      )}
    </div>
  );
}

/* ── Trajectory / confidence badges ────────────────────────────────────── */
const TRAJ_GLYPH: Record<string, string> = {
  Improving: '↗', Stable: '→', Declining: '↘', 'Sharp Reversal': '⤓',
};
export function TrajectoryBadge({ trajectory }: { trajectory: Trajectory }) {
  return <span className="badge">{TRAJ_GLYPH[trajectory] ?? '→'} Trajectory: {trajectory}</span>;
}
export function ConfidenceBadge({ confidence }: { confidence: string }) {
  return <span className="badge">Confidence: {confidence}</span>;
}

/* ── Context flag chips ────────────────────────────────────────────────── */
export function FlagChips({ flags, size = 'md' }: { flags: Company['flags']; size?: 'sm' | 'md' }) {
  const active = FLAG_LABELS.filter((f) => flags[f.key]);
  if (active.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {active.map((f) => (
        <span key={f.key} className="tflag" title={f.label}>
          ⚑ {size === 'sm' ? f.short : f.label}
        </span>
      ))}
    </div>
  );
}

/* ── Citation link ─────────────────────────────────────────────────────── */
export function Citation({ url, type }: { url: string | null; type?: string | null }) {
  if (!url) return <span className="cite" style={{ color: 'var(--txt-mut)' }}>no source recorded</span>;
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    /* keep raw */
  }
  return (
    <a className="cite" href={url} target="_blank" rel="noopener noreferrer">
      ↗ {host}
      {type ? ` · ${type}` : ''}
    </a>
  );
}

/* ── Section heading ───────────────────────────────────────────────────── */
export function SectionHeading({ id, kicker, title }: { id?: string; kicker: string; title: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: 84, marginBottom: 18 }}>
      <div className="d-k">{kicker}</div>
      <div className="d-h3" style={{ marginTop: 4 }}>{title}</div>
    </div>
  );
}
