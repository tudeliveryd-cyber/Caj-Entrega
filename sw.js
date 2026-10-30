// Caja de Entregas: guarda la app para abrir sin señal; busca la versión nueva primero,
// pero si la señal está lenta (más de 3 s) abre la copia guardada y actualiza por detrás.
const CACHE="caja-v202";
const SHELL=["./","index.html","firebase-config.js","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
// librerías de Firebase (otro sitio): se guardan también para que la app abra sin internet
const LIBS=["app","auth","firestore"].map(n=>"https://www.gstatic.com/firebasejs/10.12.2/firebase-"+n+"-compat.js");
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(SHELL);
  await Promise.all(LIBS.map(u=>fetch(u,{mode:"no-cors"}).then(r=>c.put(u,r)).catch(()=>{})))}).then(()=>self.skipWaiting()))});
// al activar: pasa las librerías ya guardadas a la copia nueva (por si la instalación fue sin señal) y borra las viejas
self.addEventListener("activate",e=>{e.waitUntil((async()=>{const ks=await caches.keys();const c=await caches.open(CACHE);
  for(const u of LIBS){if(await c.match(u))continue;for(const k of ks){if(k===CACHE)continue;const r=await (await caches.open(k)).match(u);if(r){await c.put(u,r);break}}}
  await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
const isImg=u=>/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(u.pathname);
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  const same=u.origin===location.origin;
  if(!(same||u.host==="www.gstatic.com"||u.host==="fonts.googleapis.com"||u.host==="fonts.gstatic.com"))return;
  // version.txt: siempre de la red (sirve para avisar que hay versión nueva)
  if(same&&/version\.txt$/.test(u.pathname)){e.respondWith(fetch(e.request.url,{cache:"no-store"}).catch(()=>new Response("",{status:504})));return}
  const put=r=>{if(r&&(r.ok||r.type==="opaque")){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r};
  // íconos y librerías externas: primero lo guardado (no cambian)
  if((same&&isImg(u))||!same){e.respondWith(caches.match(e.request,{ignoreVary:true}).then(c=>c||fetch(e.request).then(put).catch(()=>caches.match(e.request.url,{ignoreSearch:true}))));return}
  // la app: red primero, con espera máxima de 3 s si ya hay copia guardada
  const net=fetch(e.request.url,{cache:"no-store"}).then(put);
  e.respondWith(caches.match(e.request).then(c=>{
    if(!c)return net.catch(()=>caches.match("index.html"));
    const slow=new Promise(ok=>setTimeout(()=>ok(c),3000));
    return Promise.race([net.catch(()=>c),slow]);
  }));
  e.waitUntil(net.catch(()=>{}));
});
