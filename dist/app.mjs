import { Chess } from './vendor/chess.mjs';
import { lessons } from './lessons.mjs';
import { Engine } from './engine.mjs';
const $=id=>document.getElementById(id),engine=new Engine();
const names={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
let lesson=lessons[0],game=new Chess(lesson.fen),selected=null,flipped=false,busy=false,finished=false,success=false,revision=0,hintLevel=0,hintSquares=[],pendingPromotion=null,opponentError=false;
const completed=new Set();
const pieceImage=(code,alt='')=>`<img src="/pieces/${code}.svg" alt="${alt}" draggable="false">`;
function message(text){$('feedback').textContent=text;}
function renderLibrary(){
  let group='';$('exercise-list').innerHTML=lessons.map(item=>{
    const heading=group===item.group?'':`<p class="group-title">${item.group}</p>`;group=item.group;
    return heading+`<button class="exercise-option ${item.id===lesson.id?'active':''}" data-lesson="${item.id}" aria-pressed="${item.id===lesson.id}" aria-label="${item.title}${completed.has(item.id)?', completed':''}">${pieceImage('w'+item.icon)}<span><strong>${item.title}</strong><small>${item.detail}</small></span><span class="exercise-indicator" aria-hidden="true">${completed.has(item.id)?'✓':item.id===lesson.id?'›':'○'}</span></button>`;
  }).join('');
  $('exercise-list').querySelectorAll('button').forEach(b=>b.onclick=()=>startLesson(b.dataset.lesson));
  $('solved-count').textContent=completed.size;
}
function startLesson(id){
  const found=lessons.find(x=>x.id===id);if(!found)throw new Error('Unknown lesson.');
  revision++;lesson=found;game=new Chess(lesson.fen);selected=null;busy=false;finished=false;success=false;opponentError=false;
  pendingPromotion=null;$('promotion-dialog').close();clearHint();
  $('exercise-category').innerHTML=lesson.group.toUpperCase()+` <span> / 0${lessons.indexOf(lesson)+1}</span>`;
  $('exercise-title').textContent=lesson.title;$('exercise-description').textContent=lesson.subtitle;$('difficulty').textContent=lesson.level;
  $('objective-title').textContent=lesson.objective;$('objective-text').textContent=lesson.description;$('principle-text').textContent=lesson.principle;
  $('objective-pieces').innerHTML=lesson.material.map(x=>x==='vs'?'<span>vs.</span>':pieceImage(x,(x[0]==='w'?'White ':'Black ')+names[x[1].toLowerCase()])).join('');
  message(lesson.intro);renderLibrary();render();
}
function renderBoard(){
  const focused=document.activeElement?.dataset?.square;
  const legal=selected?game.moves({square:selected,verbose:true}).map(m=>m.to):[];
  const history=game.history({verbose:true}),last=history.at(-1);
  const files=flipped?'hgfedcba':'abcdefgh',ranks=flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
  $('board').innerHTML=ranks.map((rank,ri)=>[...files].map((file,fi)=>{
    const square=file+rank,p=game.get(square),dark=('abcdefgh'.indexOf(file)+rank)%2===1;
    const classes=['square',dark?'dark':'',last&&(last.from===square||last.to===square)?'last-move':'',square===selected?'selected':'',legal.includes(square)?'legal':'',hintSquares.includes(square)?'hinted':'',p?.type==='k'&&p.color===game.turn()&&game.isCheck()?'check':''].filter(Boolean).join(' ');
    const label=`${square}${p?', '+(p.color==='w'?'white ':'black ')+names[p.type]:', empty'}${legal.includes(square)?', legal destination':''}`;
    return `<button class="${classes}" data-square="${square}" aria-label="${label}" aria-pressed="${square===selected}" tabindex="${square===(focused||selected||'e5')?0:-1}">${p?pieceImage(p.color+p.type.toUpperCase()):''}${fi===0?`<span class="coordinate rank-label">${rank}</span>`:''}${ri===7?`<span class="coordinate file-label">${file}</span>`:''}</button>`;
  }).join('')).join('');
  if(focused)$('board').querySelector(`[data-square="${focused}"]`)?.focus({preventScroll:true});
}
function render(){
  renderBoard();const history=game.history();
  $('move-history').innerHTML=history.length?Array.from({length:Math.ceil(history.length/2)},(_,i)=>`<div class="move-row"><span>${i+1}.</span><span>${history[i*2]}</span><span>${history[i*2+1]||'…'}</span></div>`).join(''):'<p class="empty-moves">Your first move starts the story.</p>';
  $('move-history').scrollTop=$('move-history').scrollHeight;
  $('move-count').textContent='Move '+(Math.floor(history.length/2)+1);
  $('game-status').textContent=finished?(success?'Practice complete':'Position finished'):busy?(game.turn()==='b'?'Black is thinking':'Finding a hint'):game.turn()==='w'?(game.isCheck()?'White is in check':'White to move'):'Opponent paused';
  $('turn-detail').textContent=finished?'Try another ending or play this one again':busy?'Finding the next move…':game.turn()==='w'?'Your turn to find the way forward':'Retry the opponent or take back your move';
  $('turn-indicator').textContent=finished?'Finished':busy?'Thinking…':game.turn()==='w'?'Your move':'Paused';
  $('status-dot').style.background=finished?'#b89551':busy?'#a5b2a7':'var(--green)';
  $('undo-btn').disabled=history.length===0;
  $('hint-btn').disabled=finished||busy||(!opponentError&&game.turn()!=='w');
  $('hint-btn').innerHTML=opponentError?'Retry opponent':`<span aria-hidden="true">☼</span> ${hintLevel===0?'Get a hint':hintLevel===1?'Show a move':'Show a move again'} <kbd>H</kbd>`;
  $('next-btn').hidden=!finished;
  $('next-btn').innerHTML=completed.size===lessons.length?'Practice again <span>↻</span>':'Next endgame <span>→</span>';
}
function clearHint(){hintLevel=0;hintSquares=[];$('hint-panel').hidden=true;$('hint-panel').textContent='';}
function markFinished(text,won){finished=true;busy=false;success=won;if(won)completed.add(lesson.id);message(text);renderLibrary();render();}
function checkOutcome(move){
  if(game.isCheckmate()){markFinished(game.turn()==='b'?'Checkmate. Beautifully finished! Choose another endgame to keep practicing.':'Black delivered checkmate. Undo a move or restart to try another plan.',game.turn()==='b');return true;}
  if(game.isDraw()){
    const text=game.isStalemate()?'Stalemate: the side to move has no legal moves but is not in check. Leave an escape square until the final check.':game.isInsufficientMaterial()?'Draw: there is not enough material left to force checkmate. Protect your winning material.':game.isThreefoldRepetition()?'Draw by threefold repetition. Try a different plan to make progress.':'Draw by the fifty-move rule. Aim for a more efficient finish.';
    markFinished(text+' You can undo and try again.',false);return true;
  }
  if(lesson.goal==='promotion'&&move?.color==='w'&&move.promotion&&!game.moves({verbose:true}).some(m=>m.to===move.to&&m.captured)){
    markFinished('Promoted safely. You turned a small advantage into a decisive one. Well played!',true);return true;
  }
  if(lesson.goal==='promotion'&&!game.board().flat().some(p=>p?.color==='w'&&p.type==='p')&&!game.board().flat().some(p=>p?.color==='w'&&['q','r'].includes(p.type))){markFinished('The pawn is gone. Undo a move or restart to find a way to protect it.',false);return true;}
  return false;
}
async function playOpponent(){
  const token=revision;busy=true;opponentError=false;render();
  try{
    const analysis=await engine.analyze(game.fen(),550);if(token!==revision)return;
    const u=analysis.move,move=game.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
    busy=false;clearHint();if(checkOutcome(move))return;
    const v=analysis.evaluation;
    message(game.isCheck()?'Your king is in check. Find a safe response.':v?.type==='cp'&&v.value>-70?'The advantage may be slipping. Look for a more active plan, or undo your last move.':`Black played ${move.san}. Keep working toward ${lesson.goal==='promotion'?'a safe promotion':'checkmate'}.`);
    render();
  }catch(error){if(token!==revision)return;busy=false;opponentError=true;message('The opponent could not respond. Retry below, or undo your move.');render();}
}
async function makeMove(from,to,promotion='q'){
  if(busy||finished||game.turn()!=='w')throw new Error('Wait for your turn, or start another position.');
  let move;try{move=game.move({from,to,promotion});}catch{throw new Error('That move is not legal in this position.');}
  selected=null;clearHint();render();if(!checkOutcome(move))await playOpponent();
  return readState();
}
function onSquare(square){
  if(busy||finished||game.turn()!=='w')return;
  const p=game.get(square);
  if(selected===square){selected=null;renderBoard();return;}
  if(p?.color==='w'){selected=square;renderBoard();return;}
  if(!selected)return;
  const moves=game.moves({square:selected,verbose:true}).filter(m=>m.to===square);
  if(!moves.length){message('Choose one of the highlighted squares. Your king must stay out of check.');return;}
  if(moves.some(m=>m.promotion)){pendingPromotion={from:selected,to:square};$('promotion-dialog').showModal();return;}
  void makeMove(selected,square).catch(e=>message(e.message));
}
function undo(){
  if(!game.history().length)return;revision++;game.undo();if(game.turn()==='b')game.undo();busy=false;finished=false;success=false;opponentError=false;selected=null;pendingPromotion=null;$('promotion-dialog').close();clearHint();message('Take your time. Try a different idea.');render();
}
async function showHint(){
  if(opponentError){await playOpponent();return;}
  if(busy||finished||game.turn()!=='w')return;
  const panel=$('hint-panel');panel.hidden=false;
  if(hintLevel===0){panel.textContent=game.history().length===0?lesson.hint:lesson.principle;hintLevel=1;render();return;}
  const token=revision;busy=true;render();panel.textContent='Looking for a useful move…';
  try{
    const analysis=await engine.analyze(game.fen(),850);if(token!==revision)return;
    const u=analysis.move,copy=new Chess(game.fen()),m=copy.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
    hintSquares=[m.from,m.to];panel.innerHTML=`<strong>Try ${m.san}</strong>Move your ${names[m.piece]} from ${m.from} to ${m.to}${m.promotion?', and promote to a '+names[m.promotion]:''}. The highlighted squares show the move.`;
    hintLevel=2;busy=false;render();
  }catch(error){if(token!==revision)return;busy=false;panel.textContent='Move analysis is unavailable. Try again, or use the idea above.';render();}
}
function readState(){return{lesson:lesson.id,fen:game.fen(),turn:game.turn(),thinking:busy,finished,moves:game.history(),legalMoves:game.moves(),completed:[...completed]};}
$('board').addEventListener('click',e=>{const square=e.target.closest('[data-square]');if(square)onSquare(square.dataset.square);});
$('board').addEventListener('keydown',e=>{
  const squares=[...$('board').querySelectorAll('button')],index=squares.indexOf(e.target),shift={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8}[e.key];
  if(shift!==undefined){e.preventDefault();const next=squares[Math.max(0,Math.min(63,index+shift))];squares.forEach(b=>b.tabIndex=-1);next.tabIndex=0;next.focus();}
  if(e.key==='Escape'){selected=null;renderBoard();}
});
$('undo-btn').onclick=undo;$('reset-btn').onclick=()=>startLesson(lesson.id);
$('flip-btn').onclick=()=>{flipped=!flipped;renderBoard();};
$('hint-btn').onclick=()=>void showHint();
$('next-btn').onclick=()=>{const i=lessons.indexOf(lesson);const next=lessons.slice(i+1).concat(lessons.slice(0,i+1)).find(x=>!completed.has(x.id))||lessons[(i+1)%lessons.length];startLesson(next.id);};
$('promotion-options').innerHTML=['q','r','b','n'].map(p=>`<button data-promotion="${p}" aria-label="Promote to ${names[p]}">${pieceImage('w'+p.toUpperCase())}</button>`).join('');
$('promotion-options').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!pendingPromotion)return;const {from,to}=pendingPromotion;pendingPromotion=null;$('promotion-dialog').close();void makeMove(from,to,b.dataset.promotion).catch(e=>message(e.message));});
$('promotion-cancel').onclick=()=>{pendingPromotion=null;$('promotion-dialog').close();};
$('promotion-dialog').addEventListener('cancel',()=>{pendingPromotion=null;});
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!$('promotion-dialog').open&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){e.preventDefault();void showHint();}});
startLesson(lessons[0].id);
engine.init().then(()=>{$('engine-note').textContent='Powered by Stockfish · Runs in your browser';}).catch(()=>{$('engine-note').textContent='Engine will retry when you make a move';});
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const definitions=[
    {name:'read_practice_position',title:'Read chess practice position',description:'Read the current endgame, legal moves, move history and completed lessons.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>readState()},
    {name:'start_endgame_lesson',title:'Start an endgame lesson',description:'Restart the selected lesson on the visible board.',inputSchema:{type:'object',properties:{lessonId:{type:'string',enum:lessons.map(x=>x.id)}},required:['lessonId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input.lessonId!=='string')throw new Error('A lessonId is required.');startLesson(input.lessonId);return readState();}},
    {name:'play_chess_move',title:'Play a chess move',description:'Make a legal White move on the current board, then wait for the automated Black reply. Promotion defaults to a queen.',inputSchema:{type:'object',properties:{from:{type:'string',pattern:'^[a-h][1-8]$'},to:{type:'string',pattern:'^[a-h][1-8]$'},promotion:{type:'string',enum:['q','r','b','n']}},required:['from','to'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!/^([a-h][1-8])$/.test(input.from)||!/^([a-h][1-8])$/.test(input.to)||input.promotion&&!['q','r','b','n'].includes(input.promotion))throw new Error('Use valid chess squares and a valid promotion piece.');return makeMove(input.from,input.to,input.promotion||'q');}}
  ];
  definitions.forEach(tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
