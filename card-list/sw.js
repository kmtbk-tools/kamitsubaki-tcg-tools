// カードおつかいリスト：電波がなくても開けるようにするキャッシュ（このフォルダだけが対象）
const CACHE = 'kcl-v1';
const CORE = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kcl-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (req, res) => { if (res && res.ok){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; };
const withTimeout = (p, ms) => new Promise((ok, ng) => { const t = setTimeout(() => ng(new Error('timeout')), ms); p.then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); ng(e); }); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')){
    e.respondWith(withTimeout(fetch(req), 4000).then(res => put(req, res))
      .catch(() => caches.match(req, {ignoreSearch: true}).then(m => m || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(m => {
      const net = fetch(req).then(res => put(req, res)).catch(() => m);
      return m || net;
    }));
  }
});
