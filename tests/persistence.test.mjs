import test from 'node:test';
import assert from 'node:assert/strict';
import {KEY,freshData,loadData,validateData} from '../dist/preferences.mjs';
import {createPersistence} from '../dist/persistence.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
function setup(){
 const values=new Map([[KEY,JSON.stringify(freshData())]]);
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 let tail=Promise.resolve();
 const locks={request(_name,callback){const task=tail.then(callback);tail=task.catch(()=>{});return task;}};
 function tab(){
  let data=loadData(storage);
  const errors=[];
  const persistence=createPersistence({storage,initial:data,read:()=>data,locks,onError:error=>errors.push(error),adopt:merged=>{data.progress=merged.progress;data.activity=merged.activity;if(merged.practiceOrder)data.practiceOrder=merged.practiceOrder;else delete data.practiceOrder;}});
  return {get data(){return data;},set data(value){data=value;},save:options=>persistence.save(options),errors};
 }
 return {storage,tab,read:()=>validateData(JSON.parse(storage.getItem(KEY)))};
}
function win(tab,id='final-rank',moves=2){
 const record=tab.data.progress[id+':w']??={attempts:0,wins:0,cleanWins:0,bestMoves:null,lastPlayed:''};
 record.attempts++;record.wins++;record.cleanWins++;record.bestMoves=record.bestMoves===null?moves:Math.min(record.bestMoves,moves);record.lastPlayed='2026-09-19T12:00:00.000Z';
 tab.data.activity['2026-09-19']=(tab.data.activity['2026-09-19']||0)+1;
}
test('an idle tab cannot erase another tab’s win, preferences, or saved board',async()=>{
 const app=setup(),a=app.tab(),b=app.tab();
 win(b);b.data.preferences.language='zh';
 b.data.session={lessonId:'final-rank',side:'w',moves:['e1h1'],flipped:false,finished:false,success:false,usedHelp:false,credited:false,attemptRecorded:true};
 await b.save();const expected=app.read();await a.save();
 assert.deepEqual(app.read(),expected);assert.equal(a.data.progress['final-rank:w'].wins,1);
 a.data.preferences.sound=false;await a.save();
 assert.equal(app.read().preferences.language,'zh');assert.equal(app.read().preferences.sound,false);
});
test('simultaneous tabs add independent completions exactly once',async()=>{
 const app=setup(),a=app.tab(),b=app.tab();win(a,'final-rank',4);win(b,'final-rank',2);
 await Promise.all([a.save(),b.save()]);await Promise.all([a.save(),b.save()]);
 const stored=app.read();assert.equal(stored.progress['final-rank:w'].wins,2);assert.equal(stored.progress['final-rank:w'].attempts,2);assert.equal(stored.progress['final-rank:w'].cleanWins,2);assert.equal(stored.progress['final-rank:w'].bestMoves,2);assert.equal(stored.activity['2026-09-19'],2);
});
test('queued saves capture the latest state without counting it repeatedly',async()=>{
 const app=setup(),a=app.tab();win(a);const first=a.save();win(a);const second=a.save();
 await Promise.all([first,second]);assert.equal(app.read().progress['final-rank:w'].wins,2);
});
test('confirmed import replaces progress and idle tabs do not resurrect it',async()=>{
 const app=setup(),a=app.tab();win(a);await a.save();const stale=app.tab();
 a.data=freshData();await a.save({replace:true});await stale.save();
 assert.deepEqual(app.read().progress,{});assert.deepEqual(stale.data.progress,{});
 win(stale,'opposition');await stale.save();assert.deepEqual(Object.keys(app.read().progress),['opposition:w']);
});
test('failed storage writes keep pending progress for the next successful save',async()=>{
 const app=setup(),a=app.tab(),set=app.storage.setItem;win(a);
 app.storage.setItem=()=>{throw Error('quota');};await a.save();assert.equal(a.errors.length,1);
 app.storage.setItem=set;await a.save();await a.save();assert.equal(app.read().progress['final-rank:w'].wins,1);
});
test('merging into an active tab keeps its own board and preferences',async()=>{
 const app=setup(),a=app.tab(),b=app.tab();const own=clone(a.data);win(b,'opposition');await b.save();await a.save();
 assert.deepEqual(a.data.session,own.session);assert.deepEqual(a.data.preferences,own.preferences);assert.equal(a.data.progress['opposition:w'].wins,1);
});

test('shuffle decks merge independently and an idle tab cannot restore old recent positions',async()=>{
 const app=setup(),a=app.tab(),b=app.tab();
 a.data.practiceOrder={opposition:{remaining:['base','p02'],recent:['p01']}};
 b.data.practiceOrder={'queen-mate':{remaining:['base','m02'],recent:['m01']}};
 await a.save();await b.save();await a.save();
 assert.deepEqual(app.read().practiceOrder.opposition,a.data.practiceOrder.opposition);
 assert.deepEqual(app.read().practiceOrder['queen-mate'],b.data.practiceOrder['queen-mate']);
 const idle=app.tab();b.data.practiceOrder.opposition={remaining:['base'],recent:['p01','p02']};await b.save();
 await idle.save();assert.deepEqual(app.read().practiceOrder.opposition,b.data.practiceOrder.opposition);
});
