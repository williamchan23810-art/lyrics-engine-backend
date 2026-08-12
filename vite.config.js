import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Netlify hosts at root domain level ('/')
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
