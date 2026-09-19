import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
import {KEY,initialFen,freshData,loadData,validateData} from '../dist/preferences.mjs';
import {assessOutcome} from '../dist/outcome.mjs';

const longGame=JSON.parse(fs.readFileSync(new URL('./long-game.json',import.meta.url)));
const storageFor=data=>({getItem:key=>key===KEY?JSON.stringify(data):null});
function savedData(){
 const data=freshData();
 data.preferences={...data.preferences,language:'zh',sound:false,skill:7,libraryStatus:'done'};
 data.progress['final-rank:w']={attempts:4,wins:3,cleanWins:2,bestMoves:2,lastPlayed:'2026-09-18T10:00:00.000Z'};
 data.activity={'2026-09-17':1,'2026-09-18':2};
 return data;
}

test('autosave recovery preserves results and preferences when only the session is invalid',()=>{
 for(const session of [
  {lessonId:'removed-lesson',side:'w',moves:[]},
  {lessonId:'final-rank',side:'w',moves:['a1a8'],attemptRecorded:true},
  {lessonId:'final-rank',side:'w',moves:[],finished:true,success:false}
 ]){
  const data=savedData();data.session=session;
  assert.throws(()=>validateData(data));
  const recovered=loadData(storageFor(data));
  assert.deepEqual(recovered,{...data,session:null});
  assert.equal(data.session,session,'recovery must not mutate the original backup');
  assert.throws(()=>validateData(data),'manual import must continue to reject the invalid session');
 }
});

test('session recovery does not accept invalid progress or an unrelated backup format',()=>{
 const data=savedData();data.progress['final-rank:w'].wins=5;
 assert.deepEqual(loadData(storageFor(data)),freshData());
 assert.deepEqual(loadData(storageFor({...savedData(),app:'another-app'})),freshData());
});

test('a legal game longer than 500 plies round-trips without losing earlier results',()=>{
 const data=savedData(),lesson=lessons.find(l=>l.id==='protected-passer'),game=new Chess(initialFen(lesson,'w'));
 assert(longGame.length>500);
 for(const move of longGame){
  game.move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]||'q'});
  assert.equal(assessOutcome(game,lesson,'w').finished,false,'the live app must permit every ply');
 }
 data.progress['protected-passer:w']={attempts:1,wins:0,cleanWins:0,bestMoves:null,lastPlayed:'2026-09-19T10:00:00.000Z'};
 data.session={lessonId:lesson.id,side:'w',moves:longGame,flipped:false,finished:false,success:false,usedHelp:false,credited:false,attemptRecorded:true};
 assert.deepEqual(validateData(data),data);
 assert.deepEqual(loadData(storageFor(data)),data);
});

test('impossibly long sessions are bounded and do not erase valid autosaved results',()=>{
 const data=savedData();
 data.session={lessonId:'protected-passer',side:'w',moves:Array(1501).fill('d4e4')};
 assert.throws(()=>validateData(data),/Invalid saved position/);
 assert.deepEqual(loadData(storageFor(data)),{...data,session:null});
});
