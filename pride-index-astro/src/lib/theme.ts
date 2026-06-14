import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

/**
 * Island-friendly theme hook. The original SPA used a React context provider
 * wrapping the whole tree; Astro has no single React root, so islands read the
 * theme straight off the <html> class and subscribe to changes via a
 * MutationObserver. The ThemeToggle island writes the class + localStorage,
 * and every chart island re-renders when the class flips. Server-side this
 * returns the dark default, matching the pre-paint script in Layout.astro.
 */
export function useTheme(): { theme: Theme } {
  // Always start at the SSR value ('dark') so the first client render matches
  // the server HTML exactly — otherwise the pre-paint .light class would make
  // hydration mismatch. The real theme is synced in the effect below, after
  // mount, and the MutationObserver keeps it live thereafter.
  const [theme, setTheme] = useState<Theme>('dark');
  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return { theme };
}

/** Imperative toggle used by the ThemeToggle island. */
export function toggleTheme() {
  const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
  document.documentElement.classList.toggle('light', next === 'light');
  localStorage.setItem('cpi-theme', next);
}

/** Recharts can't read CSS variables, so chart chrome colors come from here. */
export function chartPalette(theme: Theme) {
  return theme === 'dark'
    ? {
        tick: '#6b7387',
        axis: '#3a4153',
        grid: '#252a37',
        label: '#c3c8d4',
        tooltipBg: '#14171f',
        tooltipBorder: '#3a4153',
        tooltipLabel: '#c3c8d4',
        tooltipItem: '#e8eaf0',
        cursor: '#ffffff0a',
        zeroLine: '#6b7387',
      }
    : {
        tick: '#64748b',
        axis: '#94a3b8',
        grid: '#e2e8f0',
        label: '#475569',
        tooltipBg: '#ffffff',
        tooltipBorder: '#cbd5e1',
        tooltipLabel: '#334155',
        tooltipItem: '#1e293b',
        cursor: '#0000000a',
        zeroLine: '#94a3b8',
      };
}
