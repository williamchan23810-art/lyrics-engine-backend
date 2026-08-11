import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace 'lyrics-engine-backend' with your repository name if different
export default defineConfig({
  plugins: [react()],
  base: '/lyrics-engine-backend/',
});
