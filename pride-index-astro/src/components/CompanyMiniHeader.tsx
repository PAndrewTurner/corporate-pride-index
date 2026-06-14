import { useEffect, useState } from 'react';
import { BAND_COLORS } from '../lib/data';
import type { Band } from '../lib/types';
import { BandChip } from './ui';

/**
 * Sticky mini-header that slides in once the company hero scrolls out of view.
 * Island (client:load). The original observed a React ref; here the hero lives
 * in static Astro markup, so we observe the element by id (#company-hero).
 */
export default function CompanyMiniHeader({
  name,
  score,
  band,
  base = '/',
}: {
  name: string;
  score: number;
  band: Band;
  base?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const hero = document.getElementById('company-hero');
    if (!hero) return;
    const obs = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting), {
      rootMargin: '-60px 0px 0px 0px',
    });
    obs.observe(hero);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 border-b border-ink-700/60 bg-ink-950/95 backdrop-blur transition-transform duration-200 ${
        visible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-12 flex items-center gap-4">
        <a href={base} className="text-xs text-ink-400 hover:text-white shrink-0">
          ← Index
        </a>
        <span className="font-display text-lg text-white truncate">{name}</span>
        <span className="ml-auto flex items-center gap-3 shrink-0">
          <span className="font-mono text-xl" style={{ color: BAND_COLORS[band] }}>
            {score}
          </span>
          <BandChip band={band} size="sm" />
        </span>
      </div>
    </div>
  );
}
