import { toggleTheme } from '../lib/theme';

/** Dark/light toggle. Island (client:load). Writes the .light class +
 *  localStorage; the pre-paint script in Layout.astro applies it before first
 *  paint to avoid a flash. The CSS (.theme-toggle .sun/.moon + html.light)
 *  swaps the icon, so no theme state is needed here. */
export default function ThemeToggle() {
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle light and dark mode"
      title="Toggle theme"
    >
      <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}
