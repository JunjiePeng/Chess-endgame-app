import {Chess} from './vendor/chess.mjs';
import {lessons} from './lessons.mjs';
import {assessOutcome} from './outcome.mjs';
export const KEY='endgame-practice-v2';
export const defaults={language:'en',sound:true,skill:20,side:'w',dots:true,coordinates:true,arrows:true,animation:true,evaluation:false,libraryGroup:'all',libraryLevel:'all',libraryStatus:'all'};
const ids=new Set(lessons.map(l=>l.id));
export function normalizePreferences(input={}){
  input=input&&typeof input==='object'?input:{};
  const p={...defaults};
  for(const k of ['sound','dots','coordinates','arrows','animation','evaluation'])if(typeof input[k]==='boolean')p[k]=input[k];
  if(['en','zh'].includes(input.language))p.language=input.language;
  if(['w','b'].includes(input.side))p.side=input.side;
  if(Number.isInteger(input.skill)&&input.skill>=0&&input.skill<=20)p.skill=input.skill;
  if(['all',...new Set(lessons.map(l=>l.group))].includes(input.libraryGroup))p.libraryGroup=input.libraryGroup;
  if(['all','Foundation','Intermediate','Advanced'].includes(input.libraryLevel))p.libraryLevel=input.libraryLevel;
  if(['all','todo','done'].includes(input.libraryStatus))p.libraryStatus=input.libraryStatus;
  return p;
}
export function initialFen(lesson,side='w'){
  if(side==='w')return lesson.fen;
  const parts=lesson.fen.split(' ');
  parts[0]=parts[0].split('/').reverse().join('/').replace(/[a-z]/gi,c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase());
  parts[1]='b';return parts.join(' ');
}
export function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function streak(activity,now=new Date()){
  const day=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(!activity[localDay(day)])day.setDate(day.getDate()-1);
  let n=0;while(activity[localDay(day)]){n++;day.setDate(day.getDate()-1);}return n;
}
const count=n=>Number.isSafeInteger(n)&&n>=0&&n<10000000;
export function validateData(raw){
  if(!raw||raw.app!=='endgame-practice'||raw.version!==2||typeof raw.progress!=='object'||!raw.progress||Array.isArray(raw.progress))throw Error('Invalid endgame backup');
  const prefs=normalizePreferences(raw.preferences),progress={},activity={};
  for(const [key,v] of Object.entries(raw.progress)){
    const [id,side]=key.split(':');
    if(key!==`${id}:${side}`||!ids.has(id)||!['w','b'].includes(side)||!v||!count(v.attempts)||!count(v.wins)||!count(v.cleanWins)||v.cleanWins>v.wins||v.wins>v.attempts||!(v.bestMoves===null||count(v.bestMoves))||typeof v.lastPlayed!=='string')throw Error('Invalid progress record');
    progress[key]={attempts:v.attempts,wins:v.wins,cleanWins:v.cleanWins,bestMoves:v.bestMoves,lastPlayed:v.lastPlayed.slice(0,30)};
  }
  if(raw.activity&&(typeof raw.activity!=='object'||Array.isArray(raw.activity)))throw Error('Invalid activity');
  for(const [day,n] of Object.entries(raw.activity||{})){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!count(n))throw Error('Invalid activity record');activity[day]=n;}
  let session=null;
  if(raw.session){
    const s=raw.session,lesson=lessons.find(l=>l.id===s.lessonId);
    if(!lesson||!['w','b'].includes(s.side)||!Array.isArray(s.moves)||s.moves.length>500)throw Error('Invalid saved position');
    const g=new Chess(initialFen(lesson,s.side));
    for(const u of s.moves){if(typeof u!=='string'||!/^([a-h][1-8]){2}[qrbn]?$/.test(u))throw Error('Invalid saved move');g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});}
    session={lessonId:s.lessonId,side:s.side,moves:[...s.moves],flipped:!!s.flipped,finished:!!s.finished,success:!!s.success,usedHelp:!!s.usedHelp,credited:!!s.credited,attemptRecorded:!!s.attemptRecorded};
    const record=progress[`${s.lessonId}:${s.side}`],result=assessOutcome(g,lesson,s.side);
    if(session.finished!==result.finished||session.success!==result.success||
      (s.moves.length&&!session.attemptRecorded)||(session.attemptRecorded&&!record?.attempts)||
      (session.credited&&!record?.wins)||(session.success&&!session.credited))throw Error('Invalid result');
  }
  return {app:'endgame-practice',version:2,preferences:prefs,progress,activity,session};
}
export function freshData(){return {app:'endgame-practice',version:2,preferences:{...defaults},progress:{},activity:{},session:null};}
export function loadData(storage){
  try{const raw=storage.getItem(KEY);if(raw)return validateData(JSON.parse(raw));}catch{}
  const data=freshData();
  // These harmless preferences are shared only on the same GitHub Pages origin.
  try{const lang=storage.getItem('otLang');if(['en','zh'].includes(lang))data.preferences.language=lang;
    const muted=storage.getItem('otMuted');if(muted==='0'||muted==='1')data.preferences.sound=muted!=='1';}catch{}
  return data;
}
