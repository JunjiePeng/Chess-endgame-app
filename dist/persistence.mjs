import {KEY,loadData} from './preferences.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const emptyRecord=()=>({attempts:0,wins:0,cleanWins:0,bestMoves:null,lastPlayed:''});

// Apply only this tab's changes to the latest stored record. In particular,
// closing an idle tab must not restore its older results or saved position.
export function mergeChanges(base,local,remote){
 const merged=copy(remote);
 for(const [key,value] of Object.entries(local.preferences))if(value!==base.preferences[key])merged.preferences[key]=value;
 for(const [key,value] of Object.entries(local.progress)){
  const before=base.progress[key]||emptyRecord();
  if(same(value,before))continue;
  const result=merged.progress[key]||emptyRecord();
  for(const field of ['attempts','wins','cleanWins'])result[field]+=Math.max(0,value[field]-before[field]);
  result.attempts=Math.max(result.attempts,result.wins);result.cleanWins=Math.min(result.cleanWins,result.wins);
  if(value.bestMoves!==before.bestMoves&&value.bestMoves!==null)result.bestMoves=result.bestMoves===null?value.bestMoves:Math.min(result.bestMoves,value.bestMoves);
  if(value.lastPlayed!==before.lastPlayed)result.lastPlayed=[result.lastPlayed,value.lastPlayed].sort().at(-1);
  merged.progress[key]=result;
 }
 for(const [day,count] of Object.entries(local.activity)){
  const added=count-(base.activity[day]||0);
  if(added>0)merged.activity[day]=(merged.activity[day]||0)+added;
 }
 for(const [id,order] of Object.entries(local.practiceOrder||{})){
  if(!same(order,base.practiceOrder?.[id])){merged.practiceOrder??={};merged.practiceOrder[id]=copy(order);}
 }
 if(!same(base.session,local.session))merged.session=copy(local.session);
 return merged;
}

export function createPersistence({storage,initial,read,adopt,onError,locks}){
 let baseline=copy(initial),queue=Promise.resolve(),replacePending=false;
 function write(){
  const local=copy(read()),remote=loadData(storage);
  const merged=replacePending?local:mergeChanges(baseline,local,remote);
  const json=JSON.stringify(merged);
  if(storage.getItem(KEY)!==json)storage.setItem(KEY,json);
  // Keep each tab's board and preferences in place; share only its totals.
  adopt(merged);baseline=copy(read());replacePending=false;
 }
 return {
  save({replace=false}={}){
   if(replace)replacePending=true;
   if(!locks?.request){try{write();}catch(error){onError(error);}return Promise.resolve();}
   const run=()=>locks.request(KEY,write);
   queue=queue.then(run,run).catch(error=>{onError(error);});
   return queue;
  }
 };
}
