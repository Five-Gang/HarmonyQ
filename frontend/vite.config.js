import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      babel: {
        babelrc: false,
        configFile: false,
      },
    }),
  ],
  server: {
    port: 5173,
    middlewareMode: false,
    proxy: {
      '/api/songs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/songs/, '/songs'),
        timeout: 30000,
        onError: (err, req, res) => {
          console.error('[Proxy Error] /api/songs:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Song service unavailable', details: err.message }));
        },
      },
      '/api/users': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/users/, '/users'),
        timeout: 30000,
        onError: (err, req, res) => {
          console.error('[Proxy Error] /api/users:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User service unavailable', details: err.message }));
        },
      },
      '/api/playlists': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/playlists/, '/playlists'),
        timeout: 30000,
        onError: (err, req, res) => {
          console.error('[Proxy Error] /api/playlists:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Playlist service unavailable', details: err.message }));
        },
      },
      '/api/recommendations': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/recommendations/, '/recommendations'),
        timeout: 30000,
        onError: (err, req, res) => {
          console.error('[Proxy Error] /api/recommendations:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Recommendation service unavailable', details: err.message }));
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
