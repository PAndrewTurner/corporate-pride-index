import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH is set by the GitHub Pages deploy workflow (e.g. /corporate-pride-index/);
// local dev and preview stay at /.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
});
