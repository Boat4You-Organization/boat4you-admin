import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Framework and UI-kit code in their own chunks: their hashes only change when a dependency
        // changes, so an admin deploy no longer makes every browser re-download ~1.6 MB of vendor code.
        // Rollup's shared CommonJS helper goes with React so the two vendor chunks never import each other.
        // Only the MUI core goes into vendor-mui: date pickers, icons and the like stay in the route chunks
        // that use them, so the first load does not grow.
        manualChunks(id) {
          if (
            id.includes('commonjsHelpers') ||
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)
          ) {
            return 'vendor-react';
          }

          if (
            /[\\/]node_modules[\\/](@mui[\\/](material|system|styled-engine|utils|private-theming)|@emotion)[\\/]/.test(
              id
            )
          ) {
            return 'vendor-mui';
          }

          return undefined;
        },
      },
    },
  },
}));
