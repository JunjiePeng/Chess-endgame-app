import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
import {initialFen,validateData,freshData,normalizePreferences} from '../dist/preferences.mjs';
import {assessOutcome} from '../dist/outcome.mjs';
import {lessonText,copy} from '../dist/i18n.mjs';
const verified=JSON.parse(fs.readFileSync(new URL('./positions.json',import.meta.url)));
const lesson=id=>lessons.find(l=>l.id===id);
const mirror=move=>move.replace(/[a-h][1-8]/g,s=>s[0]+(9-Number(s[1])));
const play=(game,uci)=>game.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||'q'});
test('all lessons retain their tablebase-verified starting positions and mirror legally',()=>{
 assert.equal(lessons.length,24);assert.equal(new Set(lessons.map(l=>l.id)).size,24);
 for(const l of lessons){
  const evidence=verified.find(p=>p.id===l.id);assert.equal(l.fen,evidence.fen);assert.equal(evidence.category,l.goal==='draw'?'draw':'win');
  for(const side of ['w','b']){
   const g=new Chess(initialFen(l,side)),enemy=side==='w'?'b':'w',king=g.board().flat().find(p=>p?.color===enemy&&p.type==='k');
   assert(!g.isAttacked(king.square,side),l.id+' leaves the non-moving king in check');assert(!g.isGameOver());
   for(const u of evidence.preservingMoves){const c=new Chess(g.fen());assert(play(c,side==='w'?u:mirror(u)));}
   for(const lang of ['en','zh'])for(const field of ['title','group','detail','description','principle','hint'])assert(lessonText(l,field,lang,side)?.trim());
  }
 }
 assert.deepEqual(Object.keys(copy.en).sort(),Object.keys(copy.zh).sort());
});
test('knight underpromotion mates for either colour; queen stalemate fails the rook puzzle',()=>{
 for(const side of ['w','b']){
  let l=lesson('knight-underpromotion'),g=new Chess(initialFen(l,side));play(g,side==='w'?'f7f8n':'f2f1n');assert.deepEqual(assessOutcome(g,l,side),{finished:true,success:true,key:'winMate'});
  l=lesson('rook-underpromotion');g=new Chess(initialFen(l,side));play(g,side==='w'?'c7c8q':'c2c1q');assert.deepEqual(assessOutcome(g,l,side),{finished:true,success:false,key:'stalemate'});
 }
});
test('defensive stalemate succeeds, saves and restores; the same result fails an attacking lesson',()=>{
 const l=lesson('rook-pawn-corner');
 for(const side of ['w','b']){
  const g=new Chess(initialFen(l,side)),moves=['a1b1','c3b3','b1a1','a3a2'].map(m=>side==='w'?m:mirror(m));moves.forEach(m=>play(g,m));
  assert.deepEqual(assessOutcome(g,l,side),{finished:true,success:true,key:'drawSaved'});
  assert.equal(assessOutcome(g,{...l,goal:'mate'},side).success,false);
  const data=freshData();data.progress[`${l.id}:${side}`]={attempts:1,wins:1,cleanWins:1,bestMoves:2,lastPlayed:''};data.session={lessonId:l.id,side,moves,finished:true,success:true,credited:true,attemptRecorded:true};
  assert(validateData(data).session.success);data.session.success=false;assert.throws(()=>validateData(data));
 }
});
test('existing six-lesson backups preserve progress and get safe filter defaults',()=>{
 const data=freshData();delete data.preferences.libraryGroup;delete data.preferences.libraryLevel;delete data.preferences.libraryStatus;
 data.progress['final-rank:w']={attempts:2,wins:1,cleanWins:1,bestMoves:2,lastPlayed:'2026-09-19'};
 const restored=validateData(data);assert.equal(restored.progress['final-rank:w'].wins,1);assert.equal(restored.preferences.libraryGroup,'all');
 assert.equal(normalizePreferences({libraryGroup:'invalid',libraryLevel:'impossible',libraryStatus:'unknown'}).libraryStatus,'all');
});

test('a fast second tap on a destination is not mistaken for the piece-selection click',async()=>{
 const {wireBoardPointer}=await import('../dist/board-effects.mjs');
 const handlers={},square=s=>({dataset:{square:s},closest(){return this;}});
 const board={addEventListener:(name,fn)=>handlers[name]=fn,children:Array.from({length:64},(_,i)=>square('abcdefgh'[i%8]+(8-Math.floor(i/8)))),querySelectorAll:()=>[],setPointerCapture(){},releasePointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,right:800,bottom:800,width:800,height:800})};
 const pointer=wireBoardPointer({board,ghost:{},canMove:()=>true,isMine:()=>true,select(){},move(){},mark(){},onCancel(){},getRevision:()=>0});
 const event={button:0,pointerId:1,clientX:450,clientY:550,target:square('e3')};
 handlers.pointerdown(event);handlers.pointerup(event);
 assert.equal(pointer.ignoreClick({detail:1,target:square('e4')}),false);
 handlers.pointerdown(event);handlers.pointerup(event);
 assert.equal(pointer.ignoreClick({detail:1,target:square('e3')}),true);
});
