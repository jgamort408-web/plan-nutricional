/* ══════════════════════════════════════════════════════════
   SERVICE WORKER · Plan Nutricional + Deporte (PWA offline)
   Estrategia network-first para mismo origen:
     · online  → siempre lo más reciente (no rompe el desarrollo)
     · offline → responde desde caché
══════════════════════════════════════════════════════════ */
const CACHE = 'plan-nutri-v30';
const SHELL = [
  'Menu%20Nutricional.html',
  'menu-ui.js',
  'menu-data.js','menu-foods.js','menu-comp.js','menu-recipes2.js','menu-recipes-junio.js','menu-app.js',
  'menu-forms.js','menu-onboard.js','menu-builder.js','menu-calendar.js','menu-saved.js','menu-shop.js','menu-unified.js','menu-session.js',
  'sport-catalog.js','sport-data.js','sport-engine.js','sport-ui.js','sport-calendar.js','sport-anim.js',
  'psicodiet.html',
  'manifest.webmanifest','favicon.svg','icon-192.png','icon-512.png','icon-180.png'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, {cache:'reload'})))))
      .then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;            // externos (CDNs) → red directa
  e.respondWith(
    fetch(req)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)); return res; })
      .catch(()=> caches.match(req).then(r => r || caches.match('Menu%20Nutricional.html')))
  );
});
