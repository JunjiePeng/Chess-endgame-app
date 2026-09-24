import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
import {KEY,initialFen,freshData,validateData,loadData} from '../dist/preferences.mjs';
import {candidateFor,createAdjudication} from '../dist/adjudication.mjs';
import {assessOutcome} from '../dist/outcome.mjs';
import {transformSquare} from '../dist/variants.mjs';
import {rememberPosition} from '../dist/positions.mjs';

// Actual base lessons, legally replayed and checked with bundled Stockfish 17.1
// at skill 20 on 2026-09-24. These are the exact 500/1200 ms search scores,
// normalized to the learner. The same mate scores also held at 2500 ms.
const fixtures=[
 {lessonId:'lucena',moves:['a1a2','g7f6','a2b2'],key:'decisiveWin',success:true,scores:[{value:6,depth:50},{value:6,depth:84}]},
 {lessonId:'rook-behind-pawn',moves:['f6g5','g8f8','g5h5','f8e7','e1b1','b7b1'],key:'decisiveLoss',success:false,scores:[{value:-11,depth:55},{value:-11,depth:75}]},
 {lessonId:'rook-underpromotion',moves:['c7c8r'],key:'decisiveWin',success:true,scores:[{value:1,depth:245},{value:1,depth:245}]}
];
const getLesson=id=>lessons.find(lesson=>lesson.id===id);
const storageFor=data=>({getItem:key=>key===KEY?JSON.stringify(data):null});
function mappedMoves(moves,side,variant){
 const square=value=>{value=transformSquare(value,variant);return side==='b'?transformSquare(value,5):value;};
 return moves.map(move=>square(move.slice(0,2))+square(move.slice(2,4))+move.slice(4));
}
function replay(lesson,moves,side='w',variant=0){
 const game=new Chess(initialFen(lesson,side,variant,'base'));
 for(const move of moves)game.move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]||'q'});
 return game;
}
function savedFixture(fixture,side='w',variant=0){
 const lesson=getLesson(fixture.lessonId),moves=mappedMoves(fixture.moves,side,variant);
 const game=replay(lesson,moves,side,variant),sign=game.turn()===side?1:-1;
 assert.equal(candidateFor(game,lesson,side),fixture.key);
 const analyses=fixture.scores.map(({value,depth})=>({evaluation:{type:'mate',value:value*sign},depth}));
 const adjudication=createAdjudication(game,lesson,side,analyses);
 assert(adjudication,`${lesson.id}/${side}/${variant} must retain its confirmed result`);
 const data=freshData();
 data.preferences={...data.preferences,side,language:'zh',sound:false,skill:7};
 data.progress['final-rank:w']={attempts:4,wins:3,cleanWins:2,bestMoves:2,lastPlayed:'2026-09-18T10:00:00.000Z'};
 data.progress[`${lesson.id}:${side}`]={attempts:6,wins:2+Number(fixture.success),cleanWins:1+Number(fixture.success),bestMoves:fixture.success?Math.min(7,Math.ceil(moves.length/2)):7,lastPlayed:'2026-09-24T10:00:00.000Z'};
 data.activity={'2026-09-18':3,'2026-09-23':2};
 data.practiceOrder={[lesson.id]:rememberPosition(lesson,'base')};
 data.session={lessonId:lesson.id,side,moves,flipped:side==='b',finished:true,success:fixture.success,usedHelp:false,credited:fixture.success,attemptRecorded:true,...(variant?{variant}:{}),adjudication};
 return {data,game,lesson};
}

test('confirmed real-lesson results restore exact histories for both colours and orientations',()=>{
 for(const fixture of fixtures)for(const side of ['w','b'])for(const variant of [0,1]){
  const {data,game,lesson}=savedFixture(fixture,side,variant),before=structuredClone(data);
  assert.deepEqual(data.session.adjudication.evaluations,fixture.scores.map(({value,depth})=>({type:'mate',value,depth})));
  assert.deepEqual(assessOutcome(game,lesson,side,data.session.adjudication),{finished:true,success:fixture.success,key:fixture.key});
  assert.deepEqual(validateData(data),data);
  const restored=loadData(storageFor(data));
  assert.deepEqual(restored,data);
  assert.equal(replay(lesson,restored.session.moves,side,variant).fen(),game.fen());
  assert.deepEqual(restored.progress,before.progress,'restoring a result must neither lose nor add historical wins');
  assert.deepEqual(restored.activity,before.activity);
  assert.deepEqual(restored.practiceOrder,before.practiceOrder);
  assert.deepEqual(data,before,'validation must not mutate the supplied backup');
 }
});

test('imports reject mismatched or insufficient evidence and inconsistent saved result flags',()=>{
 const mutations=[
  {name:'wrong FEN',change:data=>{data.session.adjudication.fen=data.session.adjudication.fen.replace(/ [wb] /,match=>match===' w '?' b ':' w ');},error:/Invalid adjudication/},
  {name:'wrong reason',change:data=>{data.session.adjudication.key=data.session.success?'decisiveLoss':'decisiveWin';},error:/Invalid adjudication/},
  {name:'wrong evaluation sign',change:data=>{data.session.adjudication.evaluations[0].value*=-1;},error:/Invalid adjudication/},
  {name:'shallow confirmation',change:data=>{data.session.adjudication.evaluations[1].depth=11;},error:/Invalid adjudication/},
  {name:'missing second confirmation',change:data=>{data.session.adjudication.evaluations.pop();},error:/Invalid adjudication/},
  {name:'wrong success flag',change:data=>{data.session.success=!data.session.success;},error:/Invalid result/},
  {name:'wrong finished flag',change:data=>{data.session.finished=false;},error:/Invalid result/}
 ];
 for(const fixture of fixtures)for(const side of ['w','b'])for(const variant of [0,1])for(const mutation of mutations){
  const {data}=savedFixture(fixture,side,variant);
  mutation.change(data);
  assert.throws(()=>validateData(data),mutation.error,`${fixture.lessonId}/${side}/${variant}: ${mutation.name}`);
 }
});

test('damaged autosaved adjudication discards only the session and retains past results',()=>{
 for(const fixture of fixtures)for(const side of ['w','b'])for(const variant of [0,1]){
  const {data}=savedFixture(fixture,side,variant),before=structuredClone(data);
  data.session.adjudication.evaluations[0].depth=1;
  assert.deepEqual(loadData(storageFor(data)),{...before,session:null});
  assert.deepEqual(data.progress,before.progress);
 }
});

test('legacy ongoing games remain playable without invented engine evidence or discarded history',()=>{
 for(const fixture of fixtures)for(const side of ['w','b'])for(const variant of [0,1]){
  const {data,game,lesson}=savedFixture(fixture,side,variant);
  delete data.session.adjudication;
  Object.assign(data.session,{finished:false,success:false,credited:false});
  assert.deepEqual(assessOutcome(game,lesson,side),{finished:false,success:false,key:null});
  assert.deepEqual(validateData(data),data);
  assert.deepEqual(loadData(storageFor(data)),data,'old legal games may continue beyond a newly introduced milestone');
 }
});

test('safe promotion, checkmate and stalemate retain priority over stale milestone evidence',()=>{
 const staleWin=savedFixture(fixtures[0]).data.session.adjudication;
 const staleLoss=savedFixture(fixtures[1]).data.session.adjudication;
 const cases=[
  {id:'passed-pawn',moves:['a5a6','g6f6','a6a7','f6e6','a7a8q'],evidence:staleLoss,result:{finished:true,success:true,key:'promoted'}},
  {id:'knight-underpromotion',moves:['f7f8n'],evidence:staleLoss,result:{finished:true,success:true,key:'winMate'}},
  {id:'rook-underpromotion',moves:['c7c8q'],evidence:staleWin,result:{finished:true,success:false,key:'stalemate'}}
 ];
 for(const item of cases)for(const side of ['w','b'])for(const variant of [0,1]){
  const lesson=getLesson(item.id),game=replay(lesson,mappedMoves(item.moves,side,variant),side,variant);
  assert.deepEqual(assessOutcome(game,lesson,side,item.evidence),item.result,`${item.id}/${side}/${variant}`);
 }
});
