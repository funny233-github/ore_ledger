import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ore_ledger/',
  plugins: [react()],
  optimizeDeps: {
    esbuild: {
      loader: { '.js': 'jsx' },
    },
  },
});
