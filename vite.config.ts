
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
  },
  esbuild: {
    // Automatically remove console.* and debugger statements in production builds
    // This ensures no internal debug info leaks to the browser console
    drop: ['console', 'debugger'],
  },
});
