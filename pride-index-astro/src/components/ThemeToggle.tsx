import { toggleTheme, useTheme } from '../lib/theme';

/** Dark/light toggle. Island (client:load). Writes the .light class +
 *  localStorage; the pre-paint script in Layout.astro applies it before first
 *  paint to avoid a flash. */
export default function ThemeToggle() {
  const { theme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="ml-2 w-8 h-8 rounded-full border border-ink-700 text-ink-300 hover:text-white hover:border-ink-400 transition-colors leading-none"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
