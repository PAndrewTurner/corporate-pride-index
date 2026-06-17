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
    <div className={`mini-header${visible ? ' show' : ''}`}>
      <div className="inner">
        <a href={base}>← Index</a>
        <span className="mh-name">{name}</span>
        <span className="mh-score">
          <span style={{ fontFamily: 'var(--mono)', fontSize: 19, color: BAND_COLORS[band] }}>{score}</span>
          <BandChip band={band} />
        </span>
      </div>
    </div>
  );
}
