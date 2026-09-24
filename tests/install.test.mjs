import test from 'node:test';
import assert from 'node:assert/strict';
import {setupOffline} from '../dist/offline.mjs';

function setGlobal(t,name,value){
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,name);
 Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
 t.after(()=>{if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];});
}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
async function fixture(t){
 const events=new Map(),offers=[];
 setGlobal(t,'window',{addEventListener:(name,callback)=>events.set(name,callback)});setGlobal(t,'navigator',{});
 await setupOffline({onStatus(){},onUpdate(){},onInstall:offer=>offers.push(offer)});
 return {
  offers,install:()=>offers.at(-1),installed:()=>events.get('appinstalled')(),
  offer({prompt=()=>Promise.resolve(),userChoice=Promise.resolve({outcome:'dismissed'})}={}){
   let calls=0,prevented=false;
   events.get('beforeinstallprompt')({preventDefault(){prevented=true;},prompt(){calls++;return prompt();},userChoice});
   return {calls:()=>calls,prevented:()=>prevented};
  }
 };
}

test('the install action hides immediately and repeated taps only show one prompt',async t=>{
 const state=await fixture(t),choice=deferred(),event=state.offer({userChoice:choice.promise}),install=state.install();
 assert.equal(event.prevented(),true);assert.equal(typeof install,'function');
 const pending=install();assert.equal(state.install(),null);assert.equal(event.calls(),1);
 assert.equal(await install(),null);assert.equal(event.calls(),1);
 choice.resolve({outcome:'dismissed'});assert.deepEqual(await pending,{outcome:'dismissed'});
 assert.equal(state.install(),null);assert.equal(await install(),null);assert.equal(event.calls(),1);
});

test('dismissal requires a fresh event before install can be offered again',async t=>{
 const state=await fixture(t),first=state.offer(),oldInstall=state.install();
 await oldInstall();assert.equal(state.install(),null);
 const next=state.offer(),newInstall=state.install();assert.equal(typeof newInstall,'function');
 await oldInstall();assert.equal(first.calls(),1);assert.equal(next.calls(),0);
 await newInstall();assert.equal(next.calls(),1);assert.equal(state.install(),null);
});

test('a newer browser event invalidates an older saved install action',async t=>{
 const state=await fixture(t),first=state.offer(),oldInstall=state.install(),next=state.offer(),newInstall=state.install();
 assert.equal(await oldInstall(),null);assert.equal(first.calls(),0);assert.equal(state.install(),newInstall);
 await newInstall();assert.equal(next.calls(),1);
});

test('a fresh event arriving during dismissal is offered after the current prompt finishes',async t=>{
 const state=await fixture(t),choice=deferred();state.offer({userChoice:choice.promise});const pending=state.install()();
 const next=state.offer();assert.equal(state.install(),null);assert.equal(next.calls(),0);
 choice.resolve({outcome:'dismissed'});await pending;
 assert.equal(typeof state.install(),'function');await state.install()();assert.equal(next.calls(),1);
});

test('appinstalled hides the action and invalidates unconsumed prompt callbacks',async t=>{
 const state=await fixture(t),event=state.offer(),install=state.install();state.installed();
 assert.equal(state.install(),null);assert.equal(await install(),null);assert.equal(event.calls(),0);
 const later=state.offer();assert.equal(state.install(),null);assert.equal(later.calls(),0);
});

test('appinstalled during an open prompt cannot restore a queued install offer',async t=>{
 const state=await fixture(t),choice=deferred();state.offer({userChoice:choice.promise});const pending=state.install()();
 const queued=state.offer();state.installed();choice.resolve({outcome:'accepted'});await pending;
 assert.equal(state.install(),null);assert.equal(queued.calls(),0);
});

test('accepting installation discards a queued prompt before appinstalled arrives',async t=>{
 const state=await fixture(t),choice=deferred();state.offer({userChoice:choice.promise});const pending=state.install()();
 const queued=state.offer();choice.resolve({outcome:'accepted'});assert.deepEqual(await pending,{outcome:'accepted'});
 assert.equal(state.install(),null);assert.equal(queued.calls(),0);state.installed();assert.equal(state.install(),null);
});

for(const failure of ['synchronous prompt','rejected prompt','rejected choice'])test(failure+' failure is handled and a fresh install event still works',async t=>{
 const state=await fixture(t),choice=deferred();
 const prompt=failure==='synchronous prompt'?()=>{throw Error('Prompt unavailable');}:failure==='rejected prompt'?()=>Promise.reject(Error('Prompt rejected')):()=>Promise.resolve();
 const event=state.offer({prompt,userChoice:choice.promise}),install=state.install(),pending=install();
 if(failure==='rejected choice')choice.reject(Error('Choice unavailable'));else choice.resolve({outcome:'dismissed'});
 assert.equal(await pending,null);assert.equal(state.install(),null);assert.equal(await install(),null);assert.equal(event.calls(),1);
 const next=state.offer();await state.install()();assert.equal(next.calls(),1);
});

test('a replacement event survives a previous prompt rejection',async t=>{
 const state=await fixture(t),prompt=deferred();state.offer({prompt:()=>prompt.promise});const pending=state.install()();
 const next=state.offer();prompt.reject(Error('Prompt interrupted'));assert.equal(await pending,null);
 assert.equal(typeof state.install(),'function');await state.install()();assert.equal(next.calls(),1);
});
