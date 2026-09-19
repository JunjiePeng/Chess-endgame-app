export async function setupOffline({onStatus,onUpdate,onInstall}){
 let reloadRequested=false;
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();onInstall(async()=>{await event.prompt();await event.userChoice;});
 });
 if(!('serviceWorker' in navigator)){onStatus('offlineFailed');return;}
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadRequested)location.reload();});
 try{
  const registration=await navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:'./',updateViaCache:'none'});
  const update=worker=>onUpdate(()=>{
   reloadRequested=true;
   // Another tab may already have activated the worker offered by this banner.
   if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
   else if(worker.state!=='activating')location.reload();
  });
  if(registration.active)onStatus('engineOffline');
  if(registration.waiting)update(registration.waiting);
  const watch=worker=>{
   if(!worker)return;
   worker.addEventListener('statechange',()=>{
    if(worker.state==='installed'){
     onStatus('engineOffline');if(navigator.serviceWorker.controller)update(worker);
    }else if(worker.state==='redundant'&&!registration.active)onStatus('offlineFailed');
   });
  };
  watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));
  navigator.serviceWorker.ready.then(()=>onStatus('engineOffline'));
 }catch{onStatus('offlineFailed');}
}
