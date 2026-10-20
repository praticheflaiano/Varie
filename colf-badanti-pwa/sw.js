const PREFIX="flaiano-domestico:"+self.registration.scope;
const CACHE=PREFIX+"1.0.0";
const ASSETS=["./index.html","./styles.css","./app.js","./data.js","./engine.js","./exports.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./README.md","./scripts/serve.mjs","./package.json"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok&&response.type!=="opaque"){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
  return response;
 }).catch(()=>event.request.mode==="navigate"?caches.match(new URL("index.html",self.registration.scope)):Response.error())));
});
