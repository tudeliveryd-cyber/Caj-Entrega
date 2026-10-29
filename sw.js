// Caja de Entregas: guarda la app para abrir sin señal; busca la versión nueva primero,
// pero si la señal está lenta (más de 3 s) abre la copia guardada y actualiza por detrás.
const CACHE="caja-v193";
const SHELL=["./","index.html","firebase-config.js","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const isImg=u=>/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(u.pathname);
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  const same=u.origin===location.origin;
  if(!(same||u.host==="www.gstatic.com"||u.host==="fonts.googleapis.com"||u.host==="fonts.gstatic.com"))return;
  // version.txt: siempre de la red (sirve para avisar que hay versión nueva)
  if(same&&/version\.txt$/.test(u.pathname)){e.respondWith(fetch(e.request.url,{cache:"no-store"}).catch(()=>new Response("",{status:504})));return}
  const put=r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r};
  // íconos y librerías externas: primero lo guardado (no cambian)
  if((same&&isImg(u))||!same){e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(put)));return}
  // la app: red primero, con espera máxima de 3 s si ya hay copia guardada
  const net=fetch(e.request.url,{cache:"no-store"}).then(put);
  e.respondWith(caches.match(e.request).then(c=>{
    if(!c)return net.catch(()=>caches.match("index.html"));
    const slow=new Promise(ok=>setTimeout(()=>ok(c),3000));
    return Promise.race([net.catch(()=>c),slow]);
  }));
  e.waitUntil(net.catch(()=>{}));
});
