import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
import {assessOutcome} from '../dist/outcome.mjs';
import {initialFen,freshData,validateData,loadData,KEY} from '../dist/preferences.mjs';
import {variantIds,variantFen,transformSquare,transformLessonText,chooseVariant} from '../dist/variants.mjs';

const uci=move=>move.from+move.to+(move.promotion||'');
const play=(game,move)=>game.move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]||'q'});
const lesson=id=>lessons.find(item=>item.id===id);
test('random setup selection never repeats the previous setup for any exercise',()=>{
 for(const item of lessons){
  const ids=variantIds(item);
  for(const previous of [undefined,...ids]){
   const choices=ids.filter(id=>id!==previous),selected=new Set();
   for(let i=0;i<choices.length;i++)selected.add(chooseVariant(item,previous,()=>i/choices.length));
   assert.deepEqual([...selected],choices,item.id);
  }
 }
});
function mapSquare(square,variant,side){return side==='w'?transformSquare(square,variant):transformSquare(transformSquare(transformSquare(square,5),variant),5);}
function mapMove(move,variant,side){return mapSquare(move.slice(0,2),variant,side)+mapSquare(move.slice(2,4),variant,side)+move.slice(4);}

test('variant IDs are stable, distinct board symmetries, with pawn direction protected',()=>{
 const squares=Array.from({length:64},(_,i)=>'abcdefgh'[i%8]+(Math.floor(i/8)+1));
 const maps=Array.from({length:8},(_,variant)=>squares.map(square=>transformSquare(square,variant)));
 assert.equal(new Set(maps.map(map=>map.join(','))).size,8);
 for(const map of maps)assert.equal(new Set(map).size,64);
 assert.equal(transformSquare('a1',1),'h1');assert.equal(transformSquare('a1',5),'a8');
 for(const item of lessons){
  const hasPawn=/[pP]/.test(item.fen.split(' ')[0]);
  assert.deepEqual(variantIds(item),hasPawn?[0,1]:[0,1,2,3,4,5,6,7]);
  assert.equal(initialFen(item,'w',0),item.fen);
  assert.equal(new Set(variantIds(item).map(id=>initialFen(item,'w',id))).size,variantIds(item).length);
  if(hasPawn)assert.throws(()=>initialFen(item,'w',2),/Invalid position variant/);
 }
 for(const bad of [-1,8,1.5,'1',null])assert.throws(()=>transformSquare('a1',bad));
 assert.throws(()=>variantFen('4k3/8/8/8/8/8/8/4K2R w K - 0 1',1),/castling/);
});

test('every allowed variant preserves legal moves and lesson outcomes through two plies for either colour',()=>{
 for(const item of lessons)for(const side of ['w','b'])for(const variant of variantIds(item)){
  const base=new Chess(initialFen(item,side)),changed=new Chess(initialFen(item,side,variant));
  const context=`${item.id} ${side} variant ${variant}`;
  assert.equal(changed.isGameOver(),false,context);
  const firstMoves=base.moves({verbose:true}).map(uci);
  assert.deepEqual(changed.moves({verbose:true}).map(uci).sort(),firstMoves.map(move=>mapMove(move,variant,side)).sort(),context);
  for(const first of firstMoves){
   play(base,first);play(changed,mapMove(first,variant,side));
   const firstResult=assessOutcome(base,item,side);
   assert.deepEqual(assessOutcome(changed,item,side),firstResult,context+' '+first);
   if(!firstResult.finished){
    const replies=base.moves({verbose:true}).map(uci);
    assert.deepEqual(changed.moves({verbose:true}).map(uci).sort(),replies.map(move=>mapMove(move,variant,side)).sort(),context+' '+first);
    for(const reply of replies){
     play(base,reply);play(changed,mapMove(reply,variant,side));
     assert.deepEqual(assessOutcome(changed,item,side),assessOutcome(base,item,side),context+' '+first+' '+reply);
     base.undo();changed.undo();
    }
   }
   base.undo();changed.undo();
  }
 }
});

test('lesson references transform squares, SAN, pawn files, ranks and files without double conversion',()=>{
 assert.equal(transformLessonText('Try Rg1+, Kc6 or e7. Protect the a-pawn along the e-file.',1),'Try Rb1+, Kf6 or d7. Protect the h-pawn along the d-file.');
 assert.equal(transformLessonText('走 Rg1+，保护 a 兵，沿 e 线推进到 e7。',1,'zh'),'走 Rb1+，保护 h 兵，沿 d 线推进到 d7。');
 assert.equal(transformLessonText('Close the h-file, then the eighth rank.',2),'Close the first rank, then the h-file.');
 assert.equal(transformLessonText('封住 h 线，再沿第八横线将军。',2,'zh'),'封住 第一横线，再沿h 线将军。');
 assert.equal(transformLessonText('Wait on the third rank, for example Rb3.',5),'Wait on the sixth rank, for example Rb6.');
 assert.equal(transformLessonText('在第三横线等着，例如 Rb3。',5,'zh'),'在第六横线等着，例如 Rb6。');
 const english='The h8 corner, h-file, eighth rank and seventh rank.';
 assert.equal(transformLessonText(transformLessonText(english,2),5),'The h8 corner, eighth rank, h-file and g-file.');
});

test('nonzero variants round-trip completed saved games for either colour',()=>{
 const item=lesson('knight-underpromotion');
 for(const side of ['w','b']){
  const data=freshData(),move=mapMove(side==='w'?'f7f8n':'f2f1n',1,side);
  data.progress[`${item.id}:${side}`]={attempts:1,wins:1,cleanWins:1,bestMoves:1,lastPlayed:''};
  data.session={lessonId:item.id,side,variant:1,moves:[move],flipped:side==='b',finished:true,success:true,usedHelp:false,credited:true,attemptRecorded:true};
  assert.deepEqual(validateData(data),data);
  assert.deepEqual(loadData({getItem:key=>key===KEY?JSON.stringify(data):null}),data);
  const withoutVariant=structuredClone(data);delete withoutVariant.session.variant;
  assert.throws(()=>validateData(withoutVariant),'the stored move requires the stored variant');
 }
 for(const variant of variantIds(lesson('final-rank'))){
  const data=freshData();data.session={lessonId:'final-rank',side:'w',variant,moves:[]};
  assert.equal(validateData(data).session.variant??0,variant);
 }
});

test('missing variants retain legacy positions; unknown or pawn-rotating variants are rejected',()=>{
 const data=freshData();data.session={lessonId:'opposition',side:'w',moves:[]};
 assert.equal(Object.hasOwn(validateData(data).session,'variant'),false);
 for(const variant of [2,7,8,-1,1.5,'1',null]){
  data.session.variant=variant;assert.throws(()=>validateData(data),/Invalid saved position/);
 }
 data.session.variant=0;assert.equal(Object.hasOwn(validateData(data).session,'variant'),false);
});
