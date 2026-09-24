// Authoring only: generate distinct positions and verify each with Lichess.
// Optional MATES_TABLEBASE_IP supplies a DNS fallback while preserving TLS.
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const execute=promisify(execFile),files='abcdefgh',squares=Array.from({length:64},(_,i)=>files[i%8]+(1+Math.floor(i/8)));
const xy=s=>[files.indexOf(s[0]),Number(s[1])-1],colour=s=>xy(s).reduce((a,b)=>a+b)%2;
const transforms=[(x,y)=>[x,y],(x,y)=>[7-x,y],(x,y)=>[y,7-x],(x,y)=>[7-x,7-y],(x,y)=>[7-y,x],(x,y)=>[x,7-y],(x,y)=>[y,x],(x,y)=>[7-y,7-x]];
function signatures(fen){
 const pieces=new Chess(fen).board().flat().filter(Boolean);
 const maps=transforms.map(transform=>pieces.map(p=>{const [x,y]=transform(...xy(p.square));return {piece:p.color+p.type,x,y};}));
 const key=pieces=>pieces.map(p=>p.piece+p.x+p.y).sort().join('|');
 return {
  board:maps.map(key).sort()[0],
  shape:maps.map(pieces=>{const minX=Math.min(...pieces.map(p=>p.x)),minY=Math.min(...pieces.map(p=>p.y));return key(pieces.map(p=>({...p,x:p.x-minX,y:p.y-minY})));}).sort()[0]
 };
}
let seed=20260925;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const pick=items=>items[Math.floor(random()*items.length)];
const setups={
 'cut-off':[['d6','b2'],['e5','b3'],['b5','e2'],['g6','c3'],['c4','f1'],['f4','b6'],['d7','g3'],['g4','d1']],
 'final-rank':[['c8','b6'],['d8','e6'],['e8','d6'],['f8','e6'],['g8','f6'],['h8','f6'],['b8','c6'],['a8','c6']],
 'queen-mate':[['d5','a2'],['f6','b3'],['c4','g1'],['e3','b7'],['g5','c2'],['b6','e4'],['f4','d1'],['d7','g3']],
 'rook-mate':[['e5','a1'],['c4','g2'],['f6','c1'],['d4','g7'],['c6','f2'],['e3','b6'],['f4','b1'],['d5','h2']],
 'ladder-mate':[['e7','g2'],['d5','b2'],['g6','c1'],['c8','g3'],['f5','a2'],['b7','e2'],['e6','h1'],['d8','f3']],
 'bishop-pair':[['e8','d6'],['h6','f5'],['b8','c6'],['f8','e6'],['h4','f4'],['c8','d6'],['g8','e6'],['h7','f6']],
 'bishop-knight':[['h8','f6'],['h8','g6'],['h8','f7'],['h8','e6'],['h8','g5'],['h8','e7'],['h8','f5'],['h8','h6']]
};
const maxDtm={'final-rank':7,'bishop-pair':21,'bishop-knight':17};
const usedBoards=new Set(),usedShapes=new Set();
for(const lesson of lessons){const keys=signatures(lesson.fen);usedBoards.add(keys.board);usedShapes.add(keys.shape);}
function candidate(id,index){
 const [enemy,king]=setups[id][index],pieces=[['k','b',enemy],['k','w',king]];
 if(id==='queen-mate')pieces.push(['q','w',pick(squares)]);
 else if(id==='ladder-mate'){
  const back=squares.filter(s=>Number(s[1])<=4);
  pieces.push(['r','w',pick(back)],['r','w',pick(back)]);
 }else if(id==='bishop-pair')pieces.push(['b','w',pick(squares.filter(s=>colour(s)===0))],['b','w',pick(squares.filter(s=>colour(s)===1))]);
 else if(id==='bishop-knight')pieces.push(['b','w',pick(squares.filter(s=>colour(s)===colour(enemy)))],['n','w',pick(['d4','e4','f4','g4','h4','c5','d5','e5','f5','g5','h5','d6','e6','f6','g6','e7','f7','g7','e8','f8'])]);
 else pieces.push(['r','w',pick(squares)]);
 if(new Set(pieces.map(p=>p[2])).size!==pieces.length)return null;
 const game=new Chess();game.clear();for(const [type,color,square]of pieces)game.put({type,color},square);
 const fen=game.fen();
 if(game.turn()!=='w'||game.isAttacked(enemy,'w')||game.isGameOver())return null;
 if(id==='final-rank'&&game.moves().some(move=>move.endsWith('#')))return null;
 const keys=signatures(fen);if(usedBoards.has(keys.board)||usedShapes.has(keys.shape))return null;
 return {fen,keys};
}
const cacheFile='/tmp/chess-mates-tablebase-cache.json';
let cache={};try{cache=JSON.parse(await readFile(cacheFile,'utf8'));}catch{}
const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
async function tablebase(fen){
 if(cache[fen])return cache[fen];
 const url='https://tablebase.lichess.ovh/standard?fen='+encodeURIComponent(fen),args=['--silent','--show-error','--fail','--max-time','30'];
 if(process.env.MATES_TABLEBASE_IP)args.push('--resolve','tablebase.lichess.ovh:443:'+process.env.MATES_TABLEBASE_IP);
 for(let attempt=0;attempt<5;attempt++){
  await sleep(attempt?Math.min(30000,3000*2**attempt):1200);
  try{
   const {stdout}=await execute('curl',[...args,url],{maxBuffer:2*1024*1024});
   const result=JSON.parse(stdout);if(!result.category||!Array.isArray(result.moves))throw Error('Incomplete tablebase response');
   cache[fen]=result;await writeFile(cacheFile,JSON.stringify(cache));return result;
  }catch(error){if(attempt===4)throw error;console.error('Retrying tablebase:',error.message.split('\n')[0]);}
 }
}
const names={k:['king','王'],q:['queen','后'],r:['rook','车'],b:['bishop','象'],n:['knight','马']};
const themes={
 'cut-off':['Keep the rook safe while it makes a barrier; bring your king closer before the final checks.','让车在安全的位置构筑屏障，先把王带近，再寻找最后的将军。'],
 'final-rank':['Cover the escape squares before giving the final rook check along the edge.','先封住逃跑格，再用车沿边线给出最后一将。'],
 'queen-mate':['Shrink the king’s space, keep your queen safe, and leave a legal move until you can give mate.','缩小对方王的活动空间，保护好后；将杀之前要给对方保留合法着法。'],
 'rook-mate':['Use the rook as a barrier and improve your king; checks work best when the escape squares are covered.','用车构筑屏障，并改善王的位置；封住逃跑格后，将军才更有效。'],
 'ladder-mate':['Let one rook block the escape line while the other gives check; keep both rooks out of the king’s reach.','让一辆车封住逃跑路线，另一辆车将军；两辆车都要避开对方王的攻击。'],
 'bishop-pair':['Keep your king close and use both bishops to cover the two colours around the edge.','让王保持接近，用双象分别控制边线附近两种颜色的格子。'],
 'bishop-knight':['The h8 corner matches your bishop. Keep the king close and let the knight cover squares the bishop cannot.','h8 角落与象同色。保持王的接近，用马封住象无法控制的格子。']
};
function entry(id,index,fen,result){
 const best=result.moves.find(move=>move.category==='loss'),game=new Chess(fen),move=game.move({from:best.uci.slice(0,2),to:best.uci.slice(2,4)}),piece=names[move.piece];
 const position={id:'m'+String(index+1).padStart(2,'0'),fen,hint:`Consider moving your ${piece[0]} from ${move.from} to ${move.to}. ${themes[id][0]}`,zh:{hint:`可考虑把${piece[1]}从 ${move.from} 走到 ${move.to}。${themes[id][1]}`}};
 if(id==='final-rank')Object.assign(position,{
  objective:'Finish the edge mate',description:'The defender is near the edge. Coordinate your king and rook to finish the mating net.',intro:'Close the remaining escape squares and find the final checks.',
  zh:{...position.zh,objective:'完成边线将杀',description:'对方王已在边线附近。协调王和车，完成最后的杀网。',intro:'封住剩余的逃跑格，寻找最后的将军。'}
 });
 return position;
}
const positions={},evidence=[];
for(const id of Object.keys(setups)){
 positions[id]=[];
 for(let index=0;index<8;index++){
  let attempts=0;
  while(true){
   if(++attempts>2000)throw Error('No suitable candidate for '+id+' '+index);
   const item=candidate(id,index);if(!item)continue;
   const result=await tablebase(item.fen);
   const preservingMoves=result.moves.filter(move=>move.category==='loss').map(move=>move.uci);
   if(result.category!=='win'||!preservingMoves.length||maxDtm[id]&&(!Number.isInteger(result.dtm)||result.dtm>maxDtm[id]))continue;
   if(id==='bishop-knight'&&result.dtm<3)continue;
   usedBoards.add(item.keys.board);usedShapes.add(item.keys.shape);
   const position=entry(id,index,item.fen,result);positions[id].push(position);
   evidence.push({lessonId:id,positionId:position.id,fen:item.fen,category:result.category,preservingMoves,...(Number.isInteger(result.dtm)?{dtm:result.dtm}:{})});
   console.log(id,position.id,'DTM',result.dtm,item.fen);break;
  }
 }
}
await mkdir(new URL('../dist/positions/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/positions/mates.mjs',import.meta.url),'// Distinct authored seeds; tablebase evidence is in tests/positions-mates.json.\nexport const matePositions = '+JSON.stringify(positions,null,2)+';\n');
await writeFile(new URL('../tests/positions-mates.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
console.log('Wrote',evidence.length,'verified positions.');
