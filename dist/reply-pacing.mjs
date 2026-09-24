export const REPLY_MINIMUM_MS=950;
export const CAPTURE_REPLY_MINIMUM_MS=1200;
const clock=()=>performance.now();
const delay=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));

// Record renderedAt with performance.now() after displaying the player's move,
// then call this after analysis. Only apply the reply when it returns true.
export async function waitForReply({renderedAt,capture=false,isCurrent=()=>true,now=clock,wait=delay}={}){
 if(!isCurrent())return false;
 const readyAt=(renderedAt??now())+(capture?CAPTURE_REPLY_MINIMUM_MS:REPLY_MINIMUM_MS);
 let remaining=readyAt-now();
 while(remaining>0){
  await wait(remaining);
  if(!isCurrent())return false;
  remaining=readyAt-now();
 }
 return isCurrent();
}
