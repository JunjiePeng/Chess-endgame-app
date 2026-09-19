import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from '../dist/engine.mjs';
import {setupOffline} from '../dist/offline.mjs';

function setGlobal(t,name,value){
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,name);
 Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
 t.after(()=>{if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];});
}
function mockWorkers(t,{construct,command}={}){
 const workers=[];
 setGlobal(t,'Worker',class {
  constructor(){construct?.();this.messages=[];this.terminated=false;workers.push(this);}
  postMessage(message){
   this.messages.push(message);
   if(command?.(this,message)===false)return;
   if(message==='uci')queueMicrotask(()=>this.emit('uciok'));
   if(message==='isready')queueMicrotask(()=>this.emit('readyok'));
   if(message.startsWith('go '))queueMicrotask(()=>{this.emit('info depth 1 score cp 20');this.emit('bestmove e2e4');});
  }
  emit(data){this.onmessage?.({data});}
  terminate(){this.terminated=true;}
 });
 return workers;
}

test('engine retries after a synchronous Worker construction failure',async t=>{
 let attempts=0;
 const workers=mockWorkers(t,{construct(){if(++attempts===1)throw Error('Worker unavailable');}}),engine=new Engine();
 await assert.rejects(engine.init(),/Worker unavailable/);
 assert.equal(engine.ready,null);
 assert.deepEqual(await engine.analyze('current',250,20),{move:'e2e4',evaluation:{type:'cp',value:20}});
 assert.equal(attempts,2);assert.equal(workers.length,1);
});

test('engine clears a failed handshake and retries initialization',async t=>{
 let failOnce=true;
 const workers=mockWorkers(t,{command(worker,message){if(message==='isready'&&failOnce){failOnce=false;throw Error('Handshake failed');}}}),engine=new Engine();
 await assert.rejects(engine.init(),/Handshake failed/);
 assert.equal(workers[0].terminated,true);assert.equal(engine.worker,null);assert.equal(engine.ready,null);
 await engine.init();assert.equal(workers.length,2);
});

test('an analysis command failure does not poison the queue or replacement worker',async t=>{
 let failOnce=true;
 const workers=mockWorkers(t,{command(worker,message){if(message.startsWith('position ')&&failOnce){failOnce=false;throw Error('Search failed');}}}),engine=new Engine();
 await assert.rejects(engine.analyze('first'),/Search failed/);
 assert.equal(workers[0].terminated,true);
 assert.equal((await engine.analyze('second')).move,'e2e4');assert.equal(workers.length,2);
});

test('an already obsolete request does not initialize a worker',async t=>{
 const workers=mockWorkers(t),engine=new Engine();
 assert.equal(await engine.analyze('obsolete',250,20,()=>false),null);
 assert.equal(workers.length,0);
});

test('obsolete queued evaluations are skipped before the next live search',async t=>{
 let started,release,held=true,current=true;
 const firstStarted=new Promise(resolve=>started=resolve);
 const workers=mockWorkers(t,{command(worker,message){
  if(message.startsWith('go ')&&held){held=false;release=()=>worker.emit('bestmove e2e4');started();return false;}
 }}),engine=new Engine(),first=engine.analyze('first');
 await firstStarted;
 const obsolete=Array.from({length:12},(_,i)=>engine.analyze('obsolete-'+i,250,20,()=>current));
 const latest=engine.analyze('current',450,20);
 current=false;release();
 await first;assert.deepEqual(await Promise.all(obsolete),Array(12).fill(null));await latest;
 assert.deepEqual(workers[0].messages.filter(message=>message.startsWith('position ')),['position fen first','position fen current']);
});

test('a request superseded during initialization does not start its search',async t=>{
 let initializing,current=true;
 const initializationStarted=new Promise(resolve=>initializing=resolve);
 const workers=mockWorkers(t,{command(worker,message){if(message==='isready'){initializing();return false;}}}),engine=new Engine();
 const pending=engine.analyze('obsolete',250,20,()=>current);
 await initializationStarted;current=false;workers[0].emit('readyok');
 assert.equal(await pending,null);
 assert.equal(workers[0].messages.some(message=>message.startsWith('position ')),false);
});

async function offlineFixture(t){
 const events=new Map(),messages=[];
 let reloads=0,activate;
 const waiting={state:'installed',postMessage:message=>messages.push(message)},registration={active:{},waiting,installing:null,addEventListener(){}};
 const serviceWorker={controller:{},register:async()=>registration,ready:Promise.resolve(registration),addEventListener:(name,callback)=>events.set(name,callback)};
 setGlobal(t,'window',{addEventListener(){}});setGlobal(t,'navigator',{serviceWorker});setGlobal(t,'location',{reload(){reloads++;}});
 await setupOffline({onStatus(){},onUpdate:callback=>activate=callback,onInstall(){}});
 return {registration,waiting,serviceWorker,messages,activate,controllerChanged:()=>events.get('controllerchange')(),reloads:()=>reloads};
}

test('update activates the waiting worker and reloads when it takes control',async t=>{
 const state=await offlineFixture(t);
 state.activate();assert.deepEqual(state.messages,[{type:'SKIP_WAITING'}]);assert.equal(state.reloads(),0);
 state.controllerChanged();assert.equal(state.reloads(),1);
});

test('update reloads after another tab has already activated its offered worker',async t=>{
 const state=await offlineFixture(t);
 state.registration.waiting=null;state.registration.active=state.waiting;state.waiting.state='activated';state.serviceWorker.controller=state.waiting;
 state.controllerChanged();assert.equal(state.reloads(),0);
 state.activate();assert.equal(state.reloads(),1);assert.deepEqual(state.messages,[]);
});

test('update waits for a worker that another tab is currently activating',async t=>{
 const state=await offlineFixture(t);
 state.registration.waiting=null;state.waiting.state='activating';
 state.activate();assert.equal(state.reloads(),0);assert.deepEqual(state.messages,[]);
 state.waiting.state='activated';state.controllerChanged();assert.equal(state.reloads(),1);
});

test('update targets the current waiting worker if the original offer was replaced',async t=>{
 const state=await offlineFixture(t),messages=[];
 state.waiting.state='redundant';state.registration.waiting={postMessage:message=>messages.push(message)};
 state.activate();assert.deepEqual(messages,[{type:'SKIP_WAITING'}]);assert.deepEqual(state.messages,[]);
});
