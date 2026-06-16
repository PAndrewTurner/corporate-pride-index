import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Static site generation (SSG): every route is pre-rendered to HTML at build
// time, which is exactly what the SEO goal requires. BASE_PATH mirrors the
// existing Vite app's GitHub Pages base handling.
export default defineConfig({
  site: 'https://pandrewturner.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  integrations: [
    react(),
    // applyBaseStyles:false → we supply our own global.css with the exact
    // @layer base / components / utilities the original app used.
    tailwind({ applyBaseStyles: false }),
    // Emits sitemap-index.xml + sitemap-*.xml for all ~200 pre-rendered pages
    // (uses `site` + `base`). Referenced from public/robots.txt.
    sitemap(),
  ],
  // The lib + data layer is imported from the sibling pride-index/ project
  // (single source of truth); allow Vite's dev server to read it.
  vite: {
    server: { fs: { allow: ['..'] } },
  },
});
