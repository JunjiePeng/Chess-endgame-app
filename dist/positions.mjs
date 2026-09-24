import {pawnPositions} from './positions/pawns.mjs';
import {matePositions} from './positions/mates.mjs';
import {specialPositions} from './positions/specials.mjs';

const pools={...pawnPositions,...matePositions,...specialPositions};
const last=(values,count)=>count?values.slice(-count):[];
// Position IDs, like orientation IDs, are part of saved games. Never reassign
// one to a different FEN. The original lesson remains the legacy "base" seed.
export function positionsFor(lesson){return [{id:'base',fen:lesson.fen},...(pools[lesson.id]||[])];}
export function getPosition(lesson,id='base'){
 const position=positionsFor(lesson).find(item=>item.id===id);
 if(!position)throw Error('Unknown starting position');
 return position;
}

// A shuffled deck visits every seed once. At the next refill, recent seeds
// stay out of the first draws, including when choosing another practice
// after reloading. Restart and colour changes keep the current seed.
export function choosePosition(lesson,order,random=Math.random){
 const ids=positionsFor(lesson).map(position=>position.id);
 const recent=last((order?.recent||[]).filter(id=>ids.includes(id)),Math.min(3,ids.length-1));
 const remaining=order?.remaining?.length?[...order.remaining]:[...ids];
 let candidates=remaining.filter(id=>!recent.includes(id));
 if(!candidates.length)candidates=remaining.filter(id=>id!==recent.at(-1));
 if(!candidates.length)candidates=remaining;
 const positionId=candidates[Math.floor(random()*candidates.length)];
 return {positionId,order:{remaining:remaining.filter(id=>id!==positionId),recent:last([...recent,positionId],Math.min(3,ids.length-1))}};
}

export function rememberPosition(lesson,id,order){
 const ids=positionsFor(lesson).map(position=>position.id);
 const remaining=order?.remaining||ids;
 const recent=order?.recent||[];
 if(recent.at(-1)===id)return order;
 return {remaining:remaining.filter(value=>value!==id),recent:last([...recent.filter(value=>value!==id),id],Math.min(3,ids.length-1))};
}

export function validatePracticeOrder(raw,lessons){
 if(raw===undefined)return {};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid practice order');
 const result={};
 for(const [lessonId,order] of Object.entries(raw)){
  const lesson=lessons.find(item=>item.id===lessonId);
  if(!lesson||!order||typeof order!=='object')throw Error('Invalid practice order');
  const ids=new Set(positionsFor(lesson).map(position=>position.id));
  for(const key of ['remaining','recent']){
   const values=order[key],limit=key==='recent'?Math.min(3,ids.size-1):ids.size;
   if(!Array.isArray(values)||values.length>limit||new Set(values).size!==values.length||values.some(id=>!ids.has(id)))throw Error('Invalid practice order');
  }
  result[lessonId]={remaining:[...order.remaining],recent:[...order.recent]};
 }
 return result;
}
