import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
import {positionsFor,getPosition,choosePosition,rememberPosition,validatePracticeOrder} from '../dist/positions.mjs';
import {variantIds,variantFen,transformSquare} from '../dist/variants.mjs';
import {initialFen,freshData,validateData,loadData,KEY} from '../dist/preferences.mjs';
import {assessOutcome} from '../dist/outcome.mjs';
import {lessonText} from '../dist/i18n.mjs';
const evidence=['pawns','mates','specials'].flatMap(name=>JSON.parse(fs.readFileSync(new URL(`./positions-${name}.json`,import.meta.url))));
const lookup=new Map(evidence.map(item=>[item.lessonId+':'+item.positionId,item]));
const canonical=(fen,lesson)=>variantIds(lesson).map(id=>variantFen(fen,id)).sort()[0];
const play=(game,u)=>game.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
const mapMove=(u,variant,side)=>u.slice(0,4).replace(/[a-h][1-8]/g,s=>{s=transformSquare(s,variant);return side==='b'?transformSquare(s,5):s;})+u.slice(4);
const material=fen=>fen.split(' ')[0].replace(/[^a-z]/gi,'').split('').sort().join('');
function rng(seed){return ()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);}

test('every lesson has a diverse, legal pool with exact tablebase verification evidence',()=>{
 let added=0;
 for(const lesson of lessons){
  const pool=positionsFor(lesson),seen=new Set();
  assert(pool.length>=6,lesson.id+' needs several real positions');
  assert.equal(new Set(pool.map(p=>p.id)).size,pool.length);
  for(const position of pool){
   const context=lesson.id+':'+position.id,g=new Chess(position.fen);
   const signature=canonical(position.fen,lesson);assert(!seen.has(signature),context+' duplicates an orientation');seen.add(signature);
   assert.equal(g.turn(),'w');assert.equal(g.isGameOver(),false,context);assert.equal(assessOutcome(g,lesson,'w').finished,false,context);
   assert.equal(material(position.fen),material(lesson.fen),context+' changes material');
   const blackKing=g.board().flat().find(p=>p?.color==='b'&&p.type==='k');assert(!g.isAttacked(blackKing.square,'w'),context+' leaves the non-moving king in check');
   if(position.id==='base')continue;
   added++;const proof=lookup.get(context);assert(proof,context+' lacks verification');assert.equal(proof.fen,position.fen);assert.equal(proof.category,lesson.goal==='draw'?'draw':'win');assert(proof.preservingMoves.length);
   for(const move of proof.preservingMoves)assert(play(new Chess(position.fen),move),context+' invalid evidence move');
   if(proof.hintMove)assert(proof.preservingMoves.includes(proof.hintMove),context+' hint fails to preserve outcome');
   for(const lang of ['en','zh'])assert(lessonText(lesson,'hint',lang,'w',0,position.id)?.trim(),context+' needs a hint');
  }
 }
 assert.equal(evidence.length,added,'verification must map exactly to shipped seeds');
});

test('new seeds preserve legal moves and outcomes in every orientation and colour',()=>{
 for(const lesson of lessons)for(const position of positionsFor(lesson).slice(1)){
  const proof=lookup.get(lesson.id+':'+position.id),base=new Chess(position.fen),moves=base.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion||''));
  for(const variant of variantIds(lesson))for(const side of ['w','b']){
   const game=new Chess(initialFen(lesson,side,variant,position.id)),context=`${lesson.id}/${position.id}/${side}/${variant}`;
   assert.equal(game.isGameOver(),false,context);
   assert.deepEqual(game.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion||'')).sort(),moves.map(m=>mapMove(m,variant,side)).sort(),context);
   const original=new Chess(position.fen);play(original,proof.preservingMoves[0]);play(game,mapMove(proof.preservingMoves[0],variant,side));
   assert.deepEqual(assessOutcome(game,lesson,side),assessOutcome(original,lesson,'w'),context);
  }
 }
});

test('underpromotion themes retain their special promotion choice in every seed',()=>{
 for(const id of ['rook-underpromotion','knight-underpromotion']){
  const lesson=lessons.find(l=>l.id===id);
  for(const position of positionsFor(lesson)){
   const game=new Chess(position.fen),promotions=game.moves({verbose:true}).filter(m=>m.promotion);
   if(id==='rook-underpromotion'){
    assert(promotions.some(m=>m.promotion==='q'&&new Chess(m.after).isStalemate()),position.id);
    assert(promotions.some(m=>m.promotion==='r'&&!new Chess(m.after).isGameOver()),position.id);
   }else assert(promotions.some(m=>m.promotion==='n'&&new Chess(m.after).isCheckmate()),position.id);
  }
 }
});

test('shuffled decks visit every starting position and avoid the last three across refills and reloads',()=>{
 for(const lesson of lessons){
  const random=rng(27),size=positionsFor(lesson).length,draws=[];let order;
  for(let i=0;i<size*6;i++){
   const result=choosePosition(lesson,order,random);
   assert(!draws.slice(-3).includes(result.positionId),lesson.id+' recent repeat');
   draws.push(result.positionId);order=result.order;
   // The same normalized state is used after exporting or reloading.
   order=validatePracticeOrder(JSON.parse(JSON.stringify({[lesson.id]:order})),lessons)[lesson.id];
   if((i+1)%size===0)assert.equal(new Set(draws.slice(-size)).size,size,lesson.id+' incomplete cycle');
  }
  assert.deepEqual(rememberPosition(lesson,draws.at(-1),order),order,'Restart must not consume another draw');
 }
});

test('new positions save and restore exact moves, orientation and colour without changing legacy defaults',()=>{
 for(const lesson of lessons)for(const position of positionsFor(lesson).slice(1))for(const side of ['w','b']){
  const variant=1,proof=lookup.get(lesson.id+':'+position.id),move=mapMove(proof.preservingMoves[0],variant,side),game=new Chess(initialFen(lesson,side,variant,position.id));play(game,move);
  const result=assessOutcome(game,lesson,side),data=freshData();
  data.progress[lesson.id+':'+side]={attempts:1,wins:result.success?1:0,cleanWins:result.success?1:0,bestMoves:result.success?1:null,lastPlayed:''};
  data.session={lessonId:lesson.id,side,positionId:position.id,variant,moves:[move],flipped:side==='b',finished:result.finished,success:result.success,usedHelp:false,credited:result.success,attemptRecorded:true};
  data.practiceOrder={[lesson.id]:rememberPosition(lesson,position.id)};
  assert.deepEqual(validateData(data),data);
  assert.deepEqual(loadData({getItem:key=>key===KEY?JSON.stringify(data):null}),data);
 }
 const legacy=freshData();legacy.session={lessonId:'opposition',side:'w',moves:[]};
 assert(!Object.hasOwn(validateData(legacy).session,'positionId'));
 for(const id of ['missing',null,5,{},'toString']){legacy.session.positionId=id;assert.throws(()=>validateData(legacy));}
});

test('damaged shuffle metadata does not erase a valid saved game or progress',()=>{
 const data=freshData(),lesson=lessons[0],position=positionsFor(lesson)[1];
 data.session={lessonId:lesson.id,side:'w',positionId:position.id,moves:[],flipped:false,finished:false,success:false,usedHelp:false,credited:false,attemptRecorded:false};
 data.practiceOrder={[lesson.id]:{remaining:['unknown'],recent:[]}};
 assert.throws(()=>validateData(data),/practice order/);
 const restored=loadData({getItem:key=>key===KEY?JSON.stringify(data):null});
 assert.deepEqual(restored.session,data.session);assert(!restored.practiceOrder);
});
