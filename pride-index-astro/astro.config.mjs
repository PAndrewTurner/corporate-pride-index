import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

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
  ],
});
