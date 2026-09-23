export class Sounds{
 constructor(enabled){this.enabled=enabled;this.context=null;}
 unlock(){if(!this.enabled())return;try{this.context??=new (window.AudioContext||window.webkitAudioContext)();if(this.context.state==='suspended')void this.context.resume();}catch{}}
 play(kind='move'){if(!this.enabled()||!this.context||this.context.state!=='running')return;const ctx=this.context;const notes=kind==='win'?[392,494,587]:kind==='capture'?[340,220]:kind==='check'?[490,620]:[330];notes.forEach((hz,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.075;osc.type='triangle';osc.frequency.setValueAtTime(hz,start);osc.frequency.exponentialRampToValueAtTime(hz*.7,start+.08);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.075,start+.004);gain.gain.exponentialRampToValueAtTime(.0001,start+.13);osc.connect(gain).connect(ctx.destination);osc.start(start);osc.stop(start+.14);});}
}
export function animateMove(board,move,enabled){if(!enabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const a=board.querySelector(`[data-square="${move.from}"]`),b=board.querySelector(`[data-square="${move.to}"]`),piece=b?.querySelector('img');if(!a||!piece?.animate)return;const r=a.getBoundingClientRect(),s=b.getBoundingClientRect();b.classList.add('animating');piece.animate([{transform:`translate(${r.x-s.x}px,${r.y-s.y}px)`},{transform:'translate(0,0)'}],{duration:160,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>b.classList.remove('animating'));}
export function wireBoardPointer({board,ghost,canMove,isMine,select,move,mark,onCancel,getRevision,onNormalPointer}){
 let drag=null,suppressUntil=0,suppressFrom=null,suppressTo=null;
 const squareAt=(x,y)=>{const r=board.getBoundingClientRect();if(x<r.left||x>=r.right||y<r.top||y>=r.bottom)return null;return board.children[Math.floor((y-r.top)/r.height*8)*8+Math.floor((x-r.left)/r.width*8)]?.dataset.square||null;};
 const cleanup=()=>{ghost.hidden=true;board.querySelectorAll('.drag-source,.drag-over').forEach(x=>x.classList.remove('drag-source','drag-over'));};
 board.addEventListener('contextmenu',e=>e.preventDefault());
 board.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;const sq=e.target.closest('[data-square]')?.dataset.square;if(!sq)return;
  const right=e.button===2;if(!right){onNormalPointer?.(sq);if(!canMove()||!isMine(sq))return;}
  drag={sq,right,x:e.clientX,y:e.clientY,id:e.pointerId,moved:false,revision:getRevision()};
  if(!right)select(sq);try{board.setPointerCapture(e.pointerId);}catch{};
 });
 board.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6){drag.moved=true;if(!drag.right){const img=board.querySelector(`[data-square="${drag.sq}"] img`);ghost.innerHTML=img?.outerHTML||'';ghost.style.width=board.getBoundingClientRect().width/8+'px';ghost.hidden=false;board.querySelector(`[data-square="${drag.sq}"]`)?.classList.add('drag-source');}}
  if(!drag.moved)return;e.preventDefault();ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';board.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));const to=squareAt(e.clientX,e.clientY);if(to)board.querySelector(`[data-square="${to}"]`)?.classList.add('drag-over');
 });
 board.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;cleanup();try{board.releasePointerCapture(e.pointerId);}catch{};if(d.revision!==getRevision())return;const to=squareAt(e.clientX,e.clientY);if(d.right){if(to)mark(d.sq,to);return;}suppressUntil=Date.now()+350;suppressFrom=d.sq;suppressTo=d.moved?to:null;if(d.moved&&to&&to!==d.sq&&canMove())move(d.sq,to);});
 board.addEventListener('pointercancel',()=>{drag=null;cleanup();onCancel();});
 board.addEventListener('lostpointercapture',()=>{if(drag){drag=null;cleanup();}});
 return {ignoreClick:e=>{const square=e.target?.closest('[data-square]')?.dataset.square;const ignore=e.detail!==0&&Date.now()<suppressUntil&&(!square||square===suppressFrom||square===suppressTo);suppressUntil=0;return ignore;},cancel:()=>{drag=null;cleanup();}};
}
