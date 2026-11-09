import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// The main site is served at / (in production by the API server).
const rawPort = process.env.WEB_PORT ?? '5173';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid WEB_PORT value: "${rawPort}"`);
}

const basePath = process.env.WEB_BASE_PATH ?? '/';
// In development, forward /api to the API server and /studio to the Studio
// dev server so the whole site works from one origin (http://localhost:5173).
const apiTarget = process.env.API_URL ?? 'http://localhost:8080';
const studioTarget = process.env.STUDIO_DEV_URL ?? 'http://localhost:5174';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
      '/studio': { target: studioTarget, changeOrigin: false, ws: true },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
