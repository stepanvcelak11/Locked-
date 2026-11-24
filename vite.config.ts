import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

/** Emits a precaching service worker that knows every hashed bundle file + public assets. */
function serviceWorker(): Plugin {
  return {
    name: 'locked-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const publicDir = join(__dirname, 'public');
      const walk = (dir: string): string[] =>
        readdirSync(dir).flatMap((f) => {
          const p = join(dir, f);
          return statSync(p).isDirectory() ? walk(p) : [relative(publicDir, p).split('\\').join('/')];
        });
      const files = ['./', 'index.html', ...walk(publicDir), ...Object.keys(bundle)].filter((f) => !f.endsWith('.map'));
      const version = createHash('sha1').update(files.join('|')).digest('hex').slice(0, 10);
      const source = `/* Locked service worker – generated at build time */
const CACHE = 'locked-${version}';
const PRECACHE = ${JSON.stringify(files.map((f) => (f.startsWith('./') ? f : './' + f)))};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('locked-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // App shell: network-first so updates arrive, cache fallback for offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }
  // Static assets: cache-first (hashed file names are immutable).
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), serviceWorker()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/recharts|d3-|victory|lodash|react-smooth|recharts-scale|decimal\.js/.test(id)) return 'charts';
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
          if (/[\\/]react(-dom)?[\\/]|scheduler/.test(id)) return 'react';
          return 'vendor';
        },
      },
    },
  },
});
