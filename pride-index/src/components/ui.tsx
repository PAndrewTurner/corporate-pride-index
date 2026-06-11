import type { Band, Company, Trajectory } from '../lib/types';
import { BAND_COLORS, FLAG_LABELS } from '../lib/data';

/* ── Band chip ─────────────────────────────────────────────────────────── */

export function BandChip({ band, size = 'md' }: { band: Band; size?: 'sm' | 'md' | 'lg' }) {
  const cls =
    size === 'lg'
      ? 'text-sm px-3 py-1'
      : size === 'sm'
        ? 'text-[10px] px-1.5 py-0.5'
        : 'text-xs px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-wider ${cls}`}
      style={{ color: BAND_COLORS[band], backgroundColor: BAND_COLORS[band] + '1a' }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: BAND_COLORS[band] }}
      />
      {band}
    </span>
  );
}

/* ── 0–100 gradient bar (the one purposeful rainbow) ───────────────────── */

const GRADIENT = `linear-gradient(to right,
  ${BAND_COLORS.Adversarial} 0%, ${BAND_COLORS.Adversarial} 19%,
  ${BAND_COLORS.Harmful} 20%, ${BAND_COLORS.Harmful} 34%,
  ${BAND_COLORS.Performative} 35%, ${BAND_COLORS.Performative} 49%,
  ${BAND_COLORS.Neutral} 50%, ${BAND_COLORS.Neutral} 64%,
  ${BAND_COLORS.Ally} 65%, ${BAND_COLORS.Ally} 79%,
  ${BAND_COLORS.Champion} 80%, ${BAND_COLORS.Champion} 100%)`;

export function GradientBar({
  score,
  height = 10,
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
      <div className="relative" style={{ paddingTop: score !== undefined ? 18 : 0 }}>
        <div
          className="rounded-full w-full opacity-90"
          style={{ height, background: GRADIENT }}
        />
        {score !== undefined && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${score}%` }}
          >
            <span className="font-mono text-[11px] text-white leading-none mb-0.5">{score}</span>
            <span className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-white" />
          </div>
        )}
        {markers.map((m) => (
          <div
            key={m.label}
            className="absolute -translate-x-1/2"
            style={{ left: `${m.score}%`, top: score !== undefined ? 18 : 0 }}
            title={`${m.label}: ${m.score}`}
          >
            <span className="block w-px bg-white/70" style={{ height: height + 4 }} />
          </div>
        ))}
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1.5 font-mono text-[10px] text-ink-400">
          <span>0 · Adversarial</span>
          <span className="hidden sm:inline">50 · Neutral baseline</span>
          <span>100 · Champion</span>
        </div>
      )}
    </div>
  );
}

/* ── Trajectory indicator ──────────────────────────────────────────────── */

const TRAJ: Record<string, { glyph: string; color: string }> = {
  Improving: { glyph: '↗', color: '#10b981' },
  Stable: { glyph: '→', color: '#9aa1b3' },
  Declining: { glyph: '↘', color: '#f97316' },
  'Sharp Reversal': { glyph: '⤓', color: '#ef4444' },
};

export function TrajectoryBadge({ trajectory }: { trajectory: Trajectory }) {
  const t = TRAJ[trajectory] ?? TRAJ.Stable;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
        trajectory === 'Sharp Reversal' ? 'animate-none ring-1 ring-red-500/40' : ''
      }`}
      style={{ color: t.color, backgroundColor: t.color + '14' }}
    >
      <span className="text-base leading-none">{t.glyph}</span>
      {trajectory}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const color =
    confidence === 'High' ? '#10b981' : confidence === 'Low' ? '#f97316' : '#eab308';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
      style={{ color, backgroundColor: color + '14' }}
      title="Analyst confidence in the underlying evidence"
    >
      Confidence: {confidence}
    </span>
  );
}

/* ── Context flag chips ────────────────────────────────────────────────── */

export function FlagChips({ flags, size = 'md' }: { flags: Company['flags']; size?: 'sm' | 'md' }) {
  const active = FLAG_LABELS.filter((f) => flags[f.key]);
  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((f) => (
        <span
          key={f.key}
          title={f.label}
          className={`inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-500/10 text-red-300 font-medium ${
            size === 'sm' ? 'text-[10px] px-1.5 py-px' : 'text-xs px-2 py-0.5'
          }`}
        >
          ⚑ {size === 'sm' ? f.short : f.label}
        </span>
      ))}
    </div>
  );
}

/* ── Citation link ─────────────────────────────────────────────────────── */

export function Citation({ url, type }: { url: string | null; type?: string | null }) {
  if (!url) return <span className="text-[11px] text-ink-400 italic">no source recorded</span>;
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    /* keep raw */
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-400/90 hover:text-sky-300 hover:underline break-all"
    >
      <span aria-hidden>↗</span>
      {host}
      {type ? <span className="text-ink-400 no-underline">· {type}</span> : null}
    </a>
  );
}

/* ── Section heading ───────────────────────────────────────────────────── */

export function SectionHeading({
  id,
  kicker,
  title,
}: {
  id?: string;
  kicker: string;
  title: string;
}) {
  return (
    <div id={id} className="scroll-mt-20 mb-4">
      <p className="label mb-1">{kicker}</p>
      <h2 className="font-display text-2xl text-white">{title}</h2>
    </div>
  );
}
