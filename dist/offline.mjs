export async function setupOffline({onStatus,onUpdate,onInstall}){
 let reloadRequested=false,installEvent=null,installing=false,installed=false;
 const offerInstall=()=>{
  if(!installEvent||installing||installed)return;
  const event=installEvent;
  onInstall(async()=>{
   if(installing||installed||installEvent!==event)return null;
   // Browser install prompts can only be used once, including after dismissal.
   installEvent=null;installing=true;onInstall(null);
   try{
    const [,choice]=await Promise.all([event.prompt(),event.userChoice]);
    if(choice?.outcome==='accepted')installEvent=null;
    return choice;
   }catch{return null;}
   finally{installing=false;offerInstall();}
  });
 };
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();if(installed)return;installEvent=event;offerInstall();
 });
 window.addEventListener('appinstalled',()=>{installed=true;installEvent=null;onInstall(null);});
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
