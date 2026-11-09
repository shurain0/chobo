/* ちょぼ：オフライン用の仕組み（ゲームのファイルだけを保存する。問題データはここには保存しない） */
const C="chobo-shell-3";
const SHELL=["./","index.html","config.js","manifest.webmanifest","icon-192.png","icon-512.png","icon-180.png","firebase/firebase-app-compat.js","firebase/firebase-auth-compat.js","firebase/firebase-firestore-compat.js"];

self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil((async()=>{const c=await caches.open(C);try{await c.addAll(SHELL);}catch(x){}
})());});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==C)await caches.delete(k);await self.clients.claim();})());});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===location.origin){
    if(u.pathname.endsWith("/admin.html"))return;
    if(u.pathname.endsWith("/version.js")){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(u.origin+u.pathname,cp));return res;}).catch(()=>caches.match(u.origin+u.pathname)));return;}
    if(u.pathname.endsWith("/game.js")){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(async c=>{for(const k of await c.keys())if(new URL(k.url).pathname.endsWith("/game.js")&&k.url!==r.url)await c.delete(k);await c.put(r,cp);});}return res;})));return;}
    e.respondWith(caches.open(C).then(async c=>{const m=await c.match(r,{ignoreSearch:true});const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res;}).catch(()=>m);return m||net;}));return;}
  if((u.hostname==="www.gstatic.com"&&u.pathname.startsWith("/firebasejs/"))||u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res;})));}
});
