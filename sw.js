// Caja de Entregas: guarda la app para abrir sin señal; siempre busca la versión nueva primero.
const CACHE="caja-v141";
const SHELL=["./","index.html","firebase-config.js","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  if(u.origin===location.origin||u.host==="www.gstatic.com"||u.host==="fonts.googleapis.com"||u.host==="fonts.gstatic.com"){
    const p=u.origin===location.origin?fetch(e.request.url,{cache:"no-store"}):fetch(e.request);
    e.respondWith(p.then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
  }
});
