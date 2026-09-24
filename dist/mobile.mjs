// Reuse the live controls in phone panels so hints, filters and history keep
// their state when moving between the board and a panel.
export function setupMobileUI({translate,showProgress}) {
 const $=id=>document.getElementById(id),media=matchMedia('(max-width: 680px)');
 const panel=$('mobile-panel'),body=$('mobile-panel-body'),nav=$('mobile-nav');
 const sections={lessons:$('library'),coach:$('coach')},homes=new Map();
 let current=null;
 for(const section of Object.values(sections)){
  const home=document.createComment('Phone panel returns here');
  section.before(home);homes.set(section,home);
 }
 function activate(name){
  for(const button of nav.querySelectorAll('[data-mobile]')){
   if(button.dataset.mobile===name)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  }
 }
 function restore(){
  if(current){const section=sections[current];homes.get(section).after(section);current=null;}
  activate('board');
 }
 function closePanel(){if(panel.open)panel.close();restore();}
 function returnToBoard({heading=false}={}){
  if(!media.matches)return;
  closePanel();
  const target=heading?$('exercise-title'):document.querySelector('.play-area');
  target.scrollIntoView({block:'start',behavior:'instant'});
  // Native dialog focus restoration points at the opener. Put it back on
  // the current board/title after choosing an exercise or reviewing a move.
  const focus=heading?$('exercise-title'):$('board').querySelector('[tabindex="0"]');
  focus?.focus({preventScroll:true});
 }
 function openPanel(name){
  if(!media.matches)return;
  closePanel();current=name;body.append(sections[name]);
  $('mobile-panel-title').textContent=translate(name==='lessons'?'lessons':'coach');
  panel.dataset.panel=name;panel.showModal();panel.scrollTop=0;body.scrollTop=0;activate(name);
 }
 nav.addEventListener('click',event=>{
  const action=event.target.closest('[data-mobile]')?.dataset.mobile;
  if(action==='board')returnToBoard();
  else if(action in sections)openPanel(action);
  else if(action==='progress'){showProgress();activate(action);}
  else if(action==='settings'){$('settings-dialog').showModal();activate(action);}
 });
 $('mobile-lessons-btn').onclick=()=>openPanel('lessons');
 $('mobile-panel-return').onclick=()=>returnToBoard();
 panel.addEventListener('close',()=>{if(!panel.open)restore();});
 for(const id of ['settings-dialog','progress-dialog'])$(id).addEventListener('close',()=>activate('board'));
 media.addEventListener('change',()=>{if(!media.matches)closePanel();});
 document.body.classList.add('mobile-ready');
 return {returnToBoard,closePanel};
}
