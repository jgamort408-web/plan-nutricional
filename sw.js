/* ══════════════════════════════════════════════════════════
   SERVICE WORKER · Plan Nutricional + Deporte (PWA offline)
   Estrategia network-first para mismo origen:
     · online  → siempre lo más reciente (no rompe el desarrollo)
     · offline → responde desde caché
══════════════════════════════════════════════════════════ */
/* La versión la SELLA build.mjs con un hash del bundle: así, cada vez que
   cambia el código, cambia el sw.js → el navegador instala un SW nuevo,
   purga la caché vieja y los clientes reciben la versión actual.
   No editar a mano. */
const CACHE = 'plan-nutri-627b4c78';
const SHELL = [
  'Menu%20Nutricional.html',
  'app.min.js?v=627b4c78',                       // núcleo (30 scripts) generado por build.mjs
  'menu-biblio.js','menu-teoria.js',  // carga diferida (se piden bajo demanda; en caché para offline)
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
      .then(res => {
        // Solo cacheamos respuestas válidas de mismo origen (evita servir
        // offline un 404/500/opaca guardada por error). Un fallo puntual
        // conserva la copia buena previa.
        if(res && res.ok && res.status === 200 && (res.type === 'basic' || res.type === 'default')){
          const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy));
        }
        return res;
      })
      .catch(()=> caches.match(req).then(r => r || caches.match('Menu%20Nutricional.html')))
  );
});
