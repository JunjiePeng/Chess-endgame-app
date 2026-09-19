import {Chess} from './vendor/chess.mjs';
import {lessons} from './lessons.mjs';
import {Engine} from './engine.mjs';
import {KEY,loadData,validateData,initialFen,localDay,streak} from './preferences.mjs';
import {translator,lessonText} from './i18n.mjs';
import {Sounds,animateMove,wireBoardPointer} from './board-effects.mjs';
import {setupOffline} from './offline.mjs';
import {assessOutcome} from './outcome.mjs';
const $=id=>document.getElementById(id),engine=new Engine();
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Storage blocked');}};}
let data=loadData(storage),prefs=data.preferences,t=translator(prefs.language),libraryQuery='';
let lesson=lessons[0],player=prefs.side,game=new Chess(initialFen(lesson,player)),selected=null,flipped=player==='b';
let busy=false,finished=false,success=false,revision=0,reviewPly=null,hintLevel=0,hintMove=null,hintText=null,pendingPromotion=null,opponentError=false;
let usedHelp=false,credited=false,attemptRecorded=false,feedback={key:'intro'},markMode=false,markFrom=null,marks=[],pendingImport=null;
let evalSequence=0,evalKey=null,evalValue=null,engineReady=false,engineFailed=false,offlineState='offlinePreparing',storageWarning=false,toastTimer;
const sounds=new Sounds(()=>prefs.sound),pieceNames={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
const image=(code)=>`<img src="./pieces/${code}.svg" alt="" draggable="false">`;
const sideName=c=>t(c==='w'?'white':'black');
const text=field=>lessonText(lesson,field,prefs.language,player);
const recordKey=()=>`${lesson.id}:${player}`;
const completedCount=side=>lessons.filter(l=>data.progress[`${l.id}:${side}`]?.wins>0).length;
const totalCompleted=()=>Object.values(data.progress).filter(p=>p.wins>0).length;
const isReviewing=()=>reviewPly!==null;
const ply=()=>reviewPly??game.history().length;
const viewGame=()=>isReviewing()?new Chess(reviewPly===0?initialFen(lesson,player):game.history({verbose:true})[reviewPly-1].after):game;
const canPlay=()=>!busy&&!finished&&!isReviewing()&&game.turn()===player&&!markMode&&!$('promotion-dialog').open;
function toast(key,args={}){$('toast').textContent=t(key,args);$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5000);}
function persist(){try{storage.setItem(KEY,JSON.stringify(data));}catch{if(!storageWarning){storageWarning=true;toast('storageError');}}}
function saveSession(){data.preferences=prefs;data.session={lessonId:lesson.id,side:player,moves:game.history({verbose:true}).map(m=>m.from+m.to+(m.promotion||'')),flipped,finished,success,usedHelp,credited,attemptRecorded};persist();}
function message(key,args={}){feedback={key,args};$('feedback').textContent=key==='intro'?text('intro'):t(key,args);}
function strengthName(){return t(prefs.skill<5?'beginner':prefs.skill<10?'casual':prefs.skill<20?'club':'strongest');}
function newAttempt(){if(attemptRecorded)return;attemptRecorded=true;const key=recordKey();data.progress[key]??={attempts:0,wins:0,cleanWins:0,bestMoves:null,lastPlayed:''};data.progress[key].attempts++;data.progress[key].lastPlayed=new Date().toISOString();}
function clearHint(){hintLevel=0;hintMove=null;hintText=null;$('hint-panel').hidden=true;$('hint-panel').textContent='';}
function matchingLessons(){
 const query=libraryQuery.trim().toLocaleLowerCase();
 return lessons.filter(item=>{
  const done=data.progress[`${item.id}:${player}`]?.wins>0;
  if(prefs.libraryGroup!=='all'&&item.group!==prefs.libraryGroup)return false;
  if(prefs.libraryLevel!=='all'&&item.level!==prefs.libraryLevel)return false;
  if(prefs.libraryStatus==='todo'&&done||prefs.libraryStatus==='done'&&!done)return false;
  return !query||['en','zh'].some(language=>['title','detail','group','principle'].some(field=>lessonText(item,field,language,player).toLocaleLowerCase().includes(query)));
 });
}
function renderLibrary(){
 const visible=matchingLessons();let group='';
 $('exercise-list').innerHTML=visible.map(item=>{
  const label=lessonText(item,'group',prefs.language,player),heading=group===label?'':`<p class="group-title">${label}</p>`;group=label;
  const done=data.progress[`${item.id}:${player}`]?.wins>0;
  return heading+`<button class="exercise-option ${item.id===lesson.id?'active':''}" data-lesson="${item.id}" aria-pressed="${item.id===lesson.id}">${image(player+item.icon)}<span><strong>${lessonText(item,'title',prefs.language,player)}</strong><small>${done?t('lessonDone',{side:sideName(player)}):lessonText(item,'detail',prefs.language,player)}</small><span class="lesson-tags">${t(item.level.toLowerCase())}<span>·</span>${t(item.goal==='draw'?'goalTagDraw':item.goal==='promotion'?'goalTagPromotion':'goalTagMate')}</span></span><span class="exercise-indicator" aria-hidden="true">${done?'✓':item.id===lesson.id?'›':'○'}</span></button>`;
 }).join('')||`<p class="empty-library">${t('noLessons')}</p>`;
 $('library-total').textContent=lessons.length;$('filter-count').textContent=t('filterCount',{n:visible.length,total:lessons.length});
 $('clear-filters').hidden=!libraryQuery&&prefs.libraryGroup==='all'&&prefs.libraryLevel==='all'&&prefs.libraryStatus==='all';$('shuffle-btn').disabled=!visible.length;
 $('solved-count').textContent=t('completed',{n:completedCount(player),total:lessons.length});const days=streak(data.activity);$('streak-label').textContent=days?t('streak',{n:days}):'';
}
function choosePractice(){
 const visible=matchingLessons();if(!visible.length)return;
 const unfinished=visible.filter(l=>!data.progress[`${l.id}:${player}`]?.wins),pool=unfinished.length?unfinished:visible,others=pool.filter(l=>l.id!==lesson.id),choices=others.length?others:pool;
 startLesson(choices[Math.floor(Math.random()*choices.length)].id);if(innerWidth<681)$('exercise-title').scrollIntoView({block:'start',behavior:'instant'});
}

function localize(){
 t=translator(prefs.language);document.documentElement.lang=prefs.language==='zh'?'zh-CN':'en';document.title=prefs.language==='zh'?'Endgame — 残局练习室':'Endgame — Chess practice room';
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.getAttribute('data-i18n')));
 document.querySelectorAll('[data-placeholder]').forEach(el=>el.placeholder=t(el.dataset.placeholder));
 document.querySelectorAll('[data-label]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.label));el.title=t(el.dataset.label);});
 $('language-btn').textContent=prefs.language==='en'?'中文':'EN';$('language-btn').ariaLabel=prefs.language==='en'?'切换到中文':'Switch to English';
 $('sound-btn').textContent=prefs.sound?'♪':'♩';$('sound-btn').setAttribute('aria-pressed',String(prefs.sound));$('sound-btn').ariaLabel=t(prefs.sound?'soundOn':'soundOff');$('sound-btn').title=$('sound-btn').ariaLabel;
 $('progress-btn').ariaLabel=t('progress');$('board').ariaLabel=t('helpPlay');$('evaluation').ariaLabel=t('evalLabel');$('review-controls').ariaLabel=t('helpReview');
 $('exercise-category').textContent=text('group').toUpperCase()+` / ${String(lessons.indexOf(lesson)+1).padStart(2,'0')}`;$('exercise-title').textContent=text('title');$('exercise-description').textContent=text('subtitle');$('difficulty').textContent=t(lesson.level.toLowerCase());
 $('objective-title').textContent=text('objective');$('objective-text').textContent=text('description');$('principle-text').textContent=text('principle');
 $('objective-pieces').innerHTML=lesson.material.map(p=>p==='vs'?'<span>vs.</span>':image((p[0]==='w'?player:player==='w'?'b':'w')+p[1])).join('');
 $('you-avatar').innerHTML=image(player+'K');$('opponent-avatar').innerHTML=image((player==='w'?'b':'w')+'K');$('you-colour').textContent=sideName(player);$('opponent-label').textContent=sideName(player==='w'?'b':'w');$('opponent-strength').textContent=strengthName();
 $('history-sides').textContent=t('white')+' / '+t('black');$('engine-note').textContent=t(engineReady?'engineNote':engineFailed?'engineRetry':'engineLoading');$('offline-status').textContent=t(offlineState);
 $('language-setting').value=prefs.language;$('side-setting').value=player;$('strength-setting').value=prefs.skill;$('strength-value').textContent=t('skill',{n:prefs.skill})+' · '+strengthName();
 for(const key of ['dots','coordinates','arrows','animation','sound','evaluation'])$(key+'-setting').checked=prefs[key];
 $('quick-dots').setAttribute('aria-pressed',String(prefs.dots));$('quick-eval').setAttribute('aria-pressed',String(prefs.evaluation));
 $('promotion-options').innerHTML=['q','r','b','n'].map(p=>`<button data-promotion="${p}" aria-label="${t('promoteTo',{piece:t(pieceNames[p])})}">${image(player+p.toUpperCase())}</button>`).join('');
 const groups=[...new Set(lessons.map(l=>l.group))];$('group-filter').innerHTML=`<option value="all">${t('allThemes')}</option>`+groups.map(g=>`<option value="${g}">${lessonText(lessons.find(l=>l.group===g),'group',prefs.language,player)}</option>`).join('');
 $('group-filter').value=prefs.libraryGroup;$('level-filter').value=prefs.libraryLevel;$('status-filter').value=prefs.libraryStatus;
 renderLibrary();render();if($('progress-dialog').open)renderProgress();
}
function startLesson(id,side=prefs.side,{save=true}={}){
 const found=lessons.find(l=>l.id===id);if(!found||!['w','b'].includes(side))throw Error('Unknown lesson or colour.');
 revision++;evalSequence++;lesson=found;player=side;prefs.side=side;game=new Chess(initialFen(lesson,side));selected=null;flipped=side==='b';busy=false;finished=false;success=false;opponentError=false;reviewPly=null;usedHelp=false;credited=false;attemptRecorded=false;pendingPromotion=null;marks=[];markFrom=null;markMode=false;evalKey=null;evalValue=null;
 pointer?.cancel();$('promotion-dialog').close();clearHint();feedback={key:'intro'};localize();if(save)saveSession();
}
function restoreSession(snapshot){
 if(!snapshot){startLesson(lessons[0].id);return;}
 startLesson(snapshot.lessonId,snapshot.side,{save:false});
 for(const u of snapshot.moves)game.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
 ({flipped,finished,success,usedHelp,credited,attemptRecorded}=snapshot);feedback={key:finished?(success?'complete':'ended'):'restored'};localize();saveSession();
 if(!finished&&game.turn()!==player)void playOpponent();
}
function renderBoard(){
 const focused=document.activeElement?.dataset?.square,g=viewGame(),legal=selected&&canPlay()?game.moves({square:selected,verbose:true}).map(m=>m.to):[],hist=game.history({verbose:true}),last=hist[ply()-1];
 const files=flipped?'hgfedcba':'abcdefgh',ranks=flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
 $('board').innerHTML=ranks.map((rank,ri)=>[...files].map((file,fi)=>{
  const square=file+rank,p=g.get(square),dark=('abcdefgh'.indexOf(file)+rank)%2===1;
  const classes=['square',dark?'dark':'',last&&(last.from===square||last.to===square)?'last-move':'',square===selected?'selected':'',prefs.dots&&legal.includes(square)?'legal':'',hintMove&&(hintMove.from===square||hintMove.to===square)&&!isReviewing()?'hinted':'',square===markFrom?'mark-start':'',p?.type==='k'&&p.color===g.turn()&&g.isCheck()?'check':''].filter(Boolean).join(' ');
  return `<button class="${classes}" data-square="${square}" aria-label="${square}, ${p?sideName(p.color)+' '+t(pieceNames[p.type]):t('empty')}${prefs.dots&&legal.includes(square)?', '+t('legal'):''}" aria-pressed="${square===selected}" tabindex="${square===(focused||selected||(flipped?'e4':'e5'))?0:-1}">${p?image(p.color+p.type.toUpperCase()):''}${prefs.coordinates&&fi===0?`<span class="coordinate rank-label">${rank}</span>`:''}${prefs.coordinates&&ri===7?`<span class="coordinate file-label">${file}</span>`:''}</button>`;
 }).join('')).join('');
 if(focused)$('board').querySelector(`[data-square="${focused}"]`)?.focus({preventScroll:true});drawMarks();
}
function drawMarks(){
 const center=s=>{const f=s.charCodeAt(0)-97,r=Number(s[1])-1;return [flipped?7-f+.5:f+.5,flipped?r+.5:7-r+.5];};
 const draw=(m,hint=false)=>{const [x1,y1]=center(m.from),[x2,y2]=center(m.to);if(m.from===m.to)return `<circle cx="${x1}" cy="${y1}" r=".39" fill="none" stroke="#d99a2f" stroke-width=".1"/>`;const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);return `<line x1="${x1+dx/len*.18}" y1="${y1+dy/len*.18}" x2="${x2-dx/len*.2}" y2="${y2-dy/len*.2}" stroke="${hint?'#267d52':'#d99a2f'}" stroke-width=".16" stroke-linecap="round" opacity=".85" marker-end="url(#${hint?'hint-head':'mark-head'})"/>`;};
 $('arrows-overlay').innerHTML='<defs><marker id="mark-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#d99a2f"/></marker><marker id="hint-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#267d52"/></marker></defs>'+marks.map(m=>draw(m)).join('')+(prefs.arrows&&hintMove&&!isReviewing()?draw(hintMove,true):'');
 $('clear-marks-btn').hidden=!marks.length&&!markFrom;$('mark-btn').setAttribute('aria-pressed',String(markMode));$('board-instruction').textContent=t(markMode?'markHelp':'instruction');
}
function toggleMark(from,to){if(!/^[a-h][1-8]$/.test(from)||!/^[a-h][1-8]$/.test(to))return;const i=marks.findIndex(m=>m.from===from&&m.to===to);if(i>=0)marks.splice(i,1);else if(marks.length<24)marks.push({from,to});markFrom=null;renderBoard();}
function renderHistory(){
 const history=game.history({verbose:true}),current=ply();
 const rows=new Map();history.forEach((m,i)=>{const number=Number(m.before.split(' ')[5]);if(!rows.has(number))rows.set(number,{w:'',b:''});rows.get(number)[m.color]=`<button data-ply="${i+1}" ${current===i+1?'aria-current="step"':''} aria-label="${number}. ${sideName(m.color)} ${m.san}">${m.san}</button>`;});
 $('move-history').innerHTML=history.length?[...rows].map(([n,m])=>`<div class="move-row"><span>${n}.</span>${m.w||'<span>—</span>'}${m.b||'<span>…</span>'}</div>`).join(''):`<p class="empty-moves">${t('emptyMoves')}</p>`;
 if(!isReviewing())$('move-history').scrollTop=$('move-history').scrollHeight;
 $('first-btn').disabled=current===0;$('previous-btn').disabled=current===0;$('forward-btn').disabled=current===history.length;$('latest-btn').disabled=!isReviewing();$('latest-btn').textContent=t(isReviewing()?'returnLive':'latest');$('review-status').textContent=t(isReviewing()?'review':'current',{n:current});$('review-controls').hidden=!history.length;$('review-status').hidden=!history.length;
}
function renderHint(){const panel=$('hint-panel');panel.hidden=hintLevel===0||isReviewing();if(hintLevel===1)panel.textContent=game.history().length?text('principle'):text('hint');else if(hintMove){panel.replaceChildren();const strong=document.createElement('strong');strong.textContent=t('tryMove',{move:hintMove.san});panel.append(strong,document.createTextNode(t('moveHint',{piece:t(pieceNames[hintMove.piece]),from:hintMove.from,to:hintMove.to})+(hintMove.promotion?' '+t('promoteHint',{piece:t(pieceNames[hintMove.promotion])}):'')));}else if(hintText)panel.textContent=t(hintText);}
function render(){
 renderBoard();renderHistory();renderHint();
 const side=sideName(game.turn()),history=game.history();
 $('move-count').textContent=t('move',{n:game.fen().split(' ')[5]});
 $('game-status').textContent=isReviewing()?t('review',{n:ply()}):finished?t(success?'complete':'ended'):busy?t(game.turn()!==player?'thinking':'finding'):game.turn()===player?t(game.isCheck()?'check':'turn',{side}):t('paused');
 $('turn-detail').textContent=t(isReviewing()?'reviewNotice':finished?'finishedDetail':busy?'thinkingDetail':game.turn()===player?'turnDetail':'pausedDetail');
 $('turn-indicator').textContent=t(isReviewing()?'returnLive':finished?'finished':busy?'thinking':game.turn()===player?'yourMove':'paused');
 $('status-dot').style.background=finished?'#b89551':busy?'#a5b2a7':'var(--green)';
 $('feedback').textContent=isReviewing()?t('reviewNotice'):feedback.key==='intro'?text('intro'):t(feedback.key,feedback.key==='blackPlayed'?{...feedback.args,goal:t(lesson.goal==='draw'?'goalDraw':lesson.goal==='promotion'?'goalPromotion':'goalMate')}:feedback.args);
 $('undo-btn').disabled=!history.length||isReviewing();$('hint-btn').disabled=finished||busy||markMode||isReviewing()||(!opponentError&&game.turn()!==player);
 $('hint-btn').innerHTML=opponentError?t('retry'):`<span aria-hidden="true">☼</span>${t(hintLevel?'showMove':'hint')}<kbd>H</kbd>`;
 $('next-btn').hidden=!finished||isReviewing();$('next-btn').textContent=t(!success||!matchingLessons().some(l=>l.id!==lesson.id)?'again':'next')+' →';
 $('board').classList.toggle('reviewing',isReviewing());$('evaluation').hidden=!prefs.evaluation;refreshEvaluation();
}
function creditWin(){if(credited)return;newAttempt();credited=true;const r=data.progress[recordKey()],moves=game.history({verbose:true}).filter(m=>m.color===player).length;r.wins++;if(!usedHelp)r.cleanWins++;r.bestMoves=r.bestMoves===null?moves:Math.min(r.bestMoves,moves);r.lastPlayed=new Date().toISOString();data.activity[localDay()]=(data.activity[localDay()]||0)+1;}
function markFinished(key,won){finished=true;busy=false;success=won;if(won){creditWin();sounds.play('win');}message(key);renderLibrary();render();saveSession();}
function checkOutcome(){
 const result=assessOutcome(game,lesson,player);
 if(!result.finished)return false;markFinished(result.key,result.success);return true;
}

function moved(move){selected=null;marks=[];markFrom=null;clearHint();evalSequence++;evalKey=null;render();sounds.play(move.san.includes('+')?'check':move.captured?'capture':'move');}
async function playOpponent(previousMove=null,animate=true){
 const token=revision;busy=true;opponentError=false;render();if(previousMove&&animate)animateMove($('board'),previousMove,prefs.animation);
 try{const result=await engine.analyze(game.fen(),350+prefs.skill*10,prefs.skill);if(token!==revision)return;const u=result.move;const move=game.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});busy=false;moved(move);if(checkOutcome(move)){animateMove($('board'),move,prefs.animation);return;}message(game.isCheck()?'checkFeedback':'blackPlayed',{move:move.san,goal:t(lesson.goal==='draw'?'goalDraw':lesson.goal==='promotion'?'goalPromotion':'goalMate')});render();animateMove($('board'),move,prefs.animation);saveSession();}
 catch{if(token!==revision)return;busy=false;opponentError=true;message('opponentError');render();saveSession();}
}
async function makeMove(from,to,promotion='q',animate=true){
 if(!canPlay())throw Error(t('notTurn'));let move;try{move=game.move({from,to,promotion});}catch{throw Error(t('illegal'));}
 newAttempt();busy=true;moved(move);saveSession();if(!checkOutcome(move))await playOpponent(move,animate);else if(animate)animateMove($('board'),move,prefs.animation);return readState();
}
function attemptMove(from,to,animate=true){
 if(!canPlay())return;const options=game.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!options.length){message('illegal');render();return;}
 if(options.some(m=>m.promotion)){pendingPromotion={from,to,animate};$('promotion-dialog').showModal();return;}
 void makeMove(from,to,'q',animate).catch(()=>{message('illegal');render();});
}
function onSquare(square){
 if(markMode){if(!markFrom){markFrom=square;renderBoard();}else toggleMark(markFrom,square);return;}
 if(!canPlay())return;const p=game.get(square);if(p?.color===player){selected=selected===square?null:square;renderBoard();return;}if(selected)attemptMove(selected,square);
}
function undo(){if(!game.history().length||isReviewing())return;revision++;evalSequence++;pointer.cancel();game.undo();if(game.turn()!==player)game.undo();busy=false;finished=false;success=false;opponentError=false;selected=null;usedHelp=true;reviewPly=null;pendingPromotion=null;marks=[];evalKey=null;$('promotion-dialog').close();clearHint();message('takeback');render();saveSession();}
async function showHint(){
 if(opponentError){await playOpponent();return;}if(!canPlay())return;usedHelp=true;
 if(hintLevel===0){hintLevel=1;render();saveSession();return;}
 const token=revision;busy=true;hintLevel=2;hintText='looking';hintMove=null;render();saveSession();
 try{const result=await engine.analyze(game.fen(),850,20);if(token!==revision)return;const u=result.move,copy=new Chess(game.fen());hintMove=copy.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});busy=false;hintText=null;render();}
 catch{if(token!==revision)return;busy=false;hintText='hintError';render();}
}
function reviewPosition(n){if(!Number.isInteger(n)||n<0||n>game.history().length)throw Error('Invalid history position');reviewPly=n===game.history().length?null:n;selected=null;marks=[];markFrom=null;markMode=false;pointer.cancel();pendingPromotion=null;$('promotion-dialog').close();evalKey=null;render();}
function showEval(value){evalValue=value;const score=$('eval-score');if(!value){score.textContent=t('evalPending');$('eval-fill').style.height='50%';return;}if(value.error){score.textContent='—';score.title=t('evalUnavailable');return;}const v=value.value;score.textContent=value.type==='mate'?(v<0?'−':'')+'M'+(value.terminal?0:Math.abs(v)):(v>0?'+':'')+(v/100).toFixed(1);score.title=t('evalLabel');score.ariaLabel=t('evalLabel')+': '+score.textContent;$('eval-fill').style.height=(value.type==='mate'?(v>=0?100:0):50+50*Math.tanh(v/500))+'%';}
function refreshEvaluation(){
 if(!prefs.evaluation){evalSequence++;evalKey=null;return;}const g=viewGame(),fen=g.fen(),key=fen+'|'+player;if(evalKey===key){if(evalValue)showEval(evalValue);return;}if(busy&&!isReviewing())return;evalKey=key;showEval(null);const seq=++evalSequence;
 if(g.isDraw()){showEval({type:'cp',value:0});return;}if(g.isCheckmate()){showEval({type:'mate',value:g.turn()===player?-1:1,terminal:true});return;}
 engine.analyze(fen,250,20).then(r=>{if(seq!==evalSequence||!prefs.evaluation)return;const e=r.evaluation;if(!e){showEval({error:true});return;}showEval({...e,value:e.value*(g.turn()===player?1:-1)});}).catch(()=>{if(seq===evalSequence)showEval({error:true});});
}
function renderProgress(){
 const rows=Object.values(data.progress),wins=rows.reduce((a,p)=>a+p.wins,0),clean=rows.reduce((a,p)=>a+p.cleanWins,0);
 $('progress-summary').innerHTML=`<div><strong>${totalCompleted()} / ${lessons.length*2}</strong><span>${t('solved')}</span></div><div><strong>${wins}</strong><span>${t('wins')}</span></div><div><strong>${clean}</strong><span>${t('clean')}</span></div><p>${t('streak',{n:streak(data.activity)})}</p>`;
 $('progress-list').innerHTML=lessons.map(l=>`<section class="lesson-progress"><h3>${lessonText(l,'title',prefs.language,player)}</h3>${['w','b'].map(side=>{const r=data.progress[`${l.id}:${side}`];return `<div><span class="side-progress">${sideName(side)} ${r?.wins?'✓':''}</span><span>${r?.wins?t('best',{n:r.bestMoves}):t('unplayed')}<small>${t('attempts',{n:r?.attempts||0})}</small></span></div>`;}).join('')}</section>`).join('');
}
function changePreference(key,value){if(key==='side'){startLesson(lesson.id,value);return;}prefs[key]=value;localize();saveSession();if(key==='sound'&&value){sounds.unlock();sounds.play();}}
function readState(){return {lesson:lesson.id,goal:lesson.goal,player,libraryCount:lessons.length,visibleLessons:matchingLessons().map(l=>l.id),fen:game.fen(),displayFen:viewGame().fen(),reviewPly,turn:game.turn(),thinking:busy,finished,success,moves:game.history(),legalMoves:game.moves(),preferences:{...prefs},completed:lessons.filter(l=>data.progress[`${l.id}:${player}`]?.wins).map(l=>l.id)};}
let pointer=wireBoardPointer({board:$('board'),ghost:$('drag-ghost'),canMove:canPlay,isMine:s=>game.get(s)?.color===player,select:s=>{selected=s;renderBoard();},move:(a,b)=>attemptMove(a,b,false),mark:toggleMark,onCancel:renderBoard,getRevision:()=>revision});
$('board').addEventListener('click',e=>{if(pointer.ignoreClick(e))return;const s=e.target.closest('[data-square]')?.dataset.square;if(s)onSquare(s);});
$('board').addEventListener('keydown',e=>{const squares=[...$('board').children],index=squares.indexOf(e.target),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8}[e.key];if(delta!==undefined){e.preventDefault();const next=squares[Math.max(0,Math.min(63,index+delta))];squares.forEach(b=>b.tabIndex=-1);next.tabIndex=0;next.focus();}if(e.key==='Escape'){selected=null;markFrom=null;renderBoard();}});
$('lesson-search').oninput=e=>{libraryQuery=e.target.value;renderLibrary();};
for(const [id,key] of [['group-filter','libraryGroup'],['level-filter','libraryLevel'],['status-filter','libraryStatus']])$(id).onchange=e=>{prefs[key]=e.target.value;renderLibrary();saveSession();};
$('clear-filters').onclick=()=>{libraryQuery='';$('lesson-search').value='';prefs.libraryGroup='all';prefs.libraryLevel='all';prefs.libraryStatus='all';localize();saveSession();};$('shuffle-btn').onclick=choosePractice;
$('exercise-list').onclick=e=>{const b=e.target.closest('[data-lesson]');if(b){startLesson(b.dataset.lesson);if(innerWidth<681)$('exercise-title').scrollIntoView({block:'start',behavior:'instant'});}};
$('undo-btn').onclick=undo;$('reset-btn').onclick=()=>startLesson(lesson.id,player);$('flip-btn').onclick=()=>{pointer.cancel();flipped=!flipped;renderBoard();saveSession();};$('hint-btn').onclick=()=>void showHint();
$('next-btn').onclick=()=>{if(!success){startLesson(lesson.id);return;}const visible=new Set(matchingLessons().map(l=>l.id)),i=lessons.indexOf(lesson),pool=lessons.slice(i+1).concat(lessons.slice(0,i)).filter(l=>visible.has(l.id)),next=pool.find(l=>!data.progress[`${l.id}:${player}`]?.wins)||pool[0]||lesson;startLesson(next.id);};
$('mark-btn').onclick=()=>{markMode=!markMode;selected=null;markFrom=null;render();};$('clear-marks-btn').onclick=()=>{marks=[];markFrom=null;renderBoard();};$('quick-dots').onclick=()=>changePreference('dots',!prefs.dots);$('quick-eval').onclick=()=>changePreference('evaluation',!prefs.evaluation);
$('move-history').onclick=e=>{const b=e.target.closest('[data-ply]');if(b)reviewPosition(Number(b.dataset.ply));};
$('first-btn').onclick=()=>reviewPosition(0);$('previous-btn').onclick=()=>reviewPosition(ply()-1);$('forward-btn').onclick=()=>reviewPosition(ply()+1);$('latest-btn').onclick=()=>reviewPosition(game.history().length);
$('review-controls').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();reviewPosition(e.key==='Home'?0:e.key==='End'?game.history().length:Math.max(0,Math.min(game.history().length,ply()+(e.key==='ArrowLeft'?-1:1))));};
$('promotion-options').onclick=e=>{const b=e.target.closest('[data-promotion]');if(!b||!pendingPromotion)return;const {from,to,animate}=pendingPromotion;pendingPromotion=null;$('promotion-dialog').close();void makeMove(from,to,b.dataset.promotion,animate).catch(()=>message('illegal'));};
$('promotion-cancel').onclick=()=>{pendingPromotion=null;$('promotion-dialog').close();};$('promotion-dialog').oncancel=()=>{pendingPromotion=null;};
$('language-btn').onclick=()=>changePreference('language',prefs.language==='en'?'zh':'en');$('sound-btn').onclick=()=>changePreference('sound',!prefs.sound);$('settings-btn').onclick=()=>$('settings-dialog').showModal();$('help-btn').onclick=()=>$('help-dialog').showModal();$('progress-btn').onclick=()=>{renderProgress();$('progress-dialog').showModal();};
$('language-setting').onchange=e=>changePreference('language',e.target.value);$('side-setting').onchange=e=>changePreference('side',e.target.value);$('strength-setting').oninput=e=>changePreference('skill',Number(e.target.value));
for(const k of ['dots','coordinates','arrows','animation','sound','evaluation'])$(k+'-setting').onchange=e=>changePreference(k,e.target.checked);
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>$(button.dataset.close).close();
$('export-btn').onclick=()=>{saveSession();const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='endgame-backup-'+localDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('downloaded');};
$('import-btn').onclick=()=>$('import-file').click();$('import-file').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>2*1024*1024)throw Error('Large file');pendingImport=validateData(JSON.parse(await file.text()));$('import-summary').textContent=t('importSummary',{n:Object.values(pendingImport.progress).filter(r=>r.wins>0).length});$('import-dialog').showModal();}catch{pendingImport=null;toast('importError');}};
$('confirm-import').onclick=()=>{if(!pendingImport)return;libraryQuery='';$('lesson-search').value='';const snapshot=pendingImport.session;data=pendingImport;prefs=data.preferences;pendingImport=null;$('import-dialog').close();$('progress-dialog').close();restoreSession(snapshot);toast('importDone');};
document.addEventListener('pointerdown',()=>sounds.unlock(),{passive:true});document.addEventListener('keydown',e=>{sounds.unlock();if(e.metaKey||e.ctrlKey||e.altKey||document.querySelector('dialog[open]')||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const actions={h:()=>void showHint(),f:()=>$('flip-btn').click(),u:undo};if(actions[e.key.toLowerCase()]){e.preventDefault();actions[e.key.toLowerCase()]();}});
window.addEventListener('pagehide',saveSession);
const snapshot=data.session;restoreSession(snapshot);engine.init().then(()=>{engineReady=true;$('engine-note').textContent=t('engineNote');}).catch(()=>{engineFailed=true;$('engine-note').textContent=t('engineRetry');});
setupOffline({onStatus:key=>{offlineState=key;$('offline-status').textContent=t(key);},onUpdate:activate=>{$('update-banner').hidden=false;$('update-btn').onclick=()=>{saveSession();activate();};},onInstall:install=>{$('install-btn').hidden=false;$('install-btn').onclick=install;}});
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();const definitions=[
  {name:'read_practice_position',description:'Read the live and displayed endgame position, preferences, legal moves and progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>readState()},
  {name:'start_endgame_lesson',description:'Start or restart one of the visible lessons. Choose White or Black; Black mirrors the original position.',inputSchema:{type:'object',properties:{lessonId:{type:'string',enum:lessons.map(l=>l.id)},side:{type:'string',enum:['w','b']}},required:['lessonId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{startLesson(input?.lessonId,input?.side||prefs.side);return readState();}},
  {name:'play_chess_move',description:'Play a legal move for the chosen practice side, then wait for the opponent. Historical boards cannot be played.',inputSchema:{type:'object',properties:{from:{type:'string',pattern:'^[a-h][1-8]$'},to:{type:'string',pattern:'^[a-h][1-8]$'},promotion:{type:'string',enum:['q','r','b','n']}},required:['from','to'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!/^[a-h][1-8]$/.test(input.from)||!/^[a-h][1-8]$/.test(input.to)||input.promotion&&!['q','r','b','n'].includes(input.promotion))throw Error('Invalid move input');return makeMove(input.from,input.to,input.promotion||'q');}}
 ];for(const tool of definitions)try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
