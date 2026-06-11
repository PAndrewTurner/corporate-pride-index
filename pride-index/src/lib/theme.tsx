import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('cpi-theme') as Theme) || 'dark',
  );
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('cpi-theme', theme);
  }, [theme]);
  return (
    <ThemeCtx.Provider
      value={{ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);

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
