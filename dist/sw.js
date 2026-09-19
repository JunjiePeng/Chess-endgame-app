// Bump this version whenever a deployed app asset changes.
const CACHE='endgame-v2.1.2';
const ASSETS=['./','./index.html','./style.css','./app.mjs','./preferences.mjs','./outcome.mjs','./i18n.mjs','./board-effects.mjs','./offline.mjs','./engine.mjs','./lessons.mjs','./credits.html','./manifest.webmanifest','./favicon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png','./vendor/chess.mjs','./vendor/chess-LICENSE','./vendor/Copying.txt','./vendor/stockfish-17.1-lite-single-03e3232.js','./vendor/stockfish-17.1-lite-single-03e3232.wasm',...['w','b'].flatMap(c=>['K','Q','R','B','N','P'].map(p=>`./pieces/${c}${p}.svg`))];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // The opening trainer shares this origin. Never remove its caches.
 for(const key of await caches.keys())if(key.startsWith('endgame-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(request,{ignoreSearch:true});
  if(cached)return cached;
  return fetch(request);
 })());
});
