import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
import {specialPositions} from '../dist/positions/specials.mjs';
const evidence=JSON.parse(fs.readFileSync(new URL('../tests/positions-specials.json',import.meta.url)));
const material=g=>g.board().flat().filter(Boolean).map(p=>p.color+p.type).sort();
const move=(game,u)=>game.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
function shape(g){const pieces=g.board().flat().filter(Boolean).map(p=>({type:p.color+p.type,x:p.square.charCodeAt(0)-97,y:Number(p.square[1])})),minX=Math.min(...pieces.map(p=>p.x)),maxX=Math.max(...pieces.map(p=>p.x)),minY=Math.min(...pieces.map(p=>p.y));return [false,true].map(mirror=>pieces.map(p=>`${p.type}:${mirror?maxX-p.x:p.x-minX},${p.y-minY}`).sort().join('|')).sort()[0];}
let count=0;
for(const [id,positions]of Object.entries(specialPositions)){
 const original=lessons.find(l=>l.id===id),shapes=new Set([shape(new Chess(original.fen))]);
 assert(positions.length>=5,id);assert.equal(new Set(positions.map(p=>p.id)).size,positions.length);
 for(const p of positions){
  const g=new Chess(p.fen),entry=evidence.find(e=>e.lessonId===id&&e.positionId===p.id);assert(entry,id+' '+p.id);
  assert.equal(g.turn(),'w');assert(!g.isGameOver());assert.deepEqual(material(g),material(new Chess(original.fen)));assert(!g.isAttacked(g.board().flat().find(p=>p?.color==='b'&&p.type==='k').square,'w'));
  assert(!shapes.has(shape(g)),'translated/reflected duplicate '+id+' '+p.id);shapes.add(shape(g));
  assert.equal(entry.fen,p.fen);assert.equal(entry.category,original.goal==='draw'?'draw':'win');assert(entry.preservingMoves.length);assert(entry.preservingMoves.includes(entry.teachingMove));assert.equal(new URL(entry.provenance.source).searchParams.get('fen'),p.fen);assert(Number.isFinite(Date.parse(entry.provenance.queriedAt)));assert(entry.provenance.source.startsWith('https://tablebase.lichess.ovh/standard?fen='));assert(p.hint.trim());assert(p.zh.hint.trim());
  for(const u of entry.preservingMoves){const c=new Chess(p.fen);assert(move(c,u));}
  if(id==='rook-underpromotion'){
   const q=new Chess(p.fen),r=new Chess(p.fen);move(q,entry.queenPromotion.uci);move(r,entry.rookPromotion.uci);assert(q.isStalemate());assert(!r.isGameOver());assert.equal(entry.queenPromotion.category,'draw');assert.equal(entry.rookPromotion.category,'loss');
  }
  if(id==='knight-underpromotion'){
   const n=new Chess(p.fen),q=new Chess(p.fen);move(n,entry.knightPromotion.uci);move(q,entry.knightPromotion.uci.slice(0,4)+'q');assert(n.isCheckmate());assert(!q.isCheckmate());
  }
  if(id==='wrong-bishop'){const bishop=g.board().flat().find(p=>p?.type==='b');assert.equal((bishop.square.charCodeAt(0)-97+Number(bishop.square[1])-1)%2,1);}
  if(id==='rook-behind-pawn'){const pawn=g.board().flat().find(p=>p?.color==='w'&&p.type==='p'),rook=g.board().flat().find(p=>p?.color==='w'&&p.type==='r');assert.equal(pawn.square[0],rook.square[0]);assert(Number(rook.square[1])<Number(pawn.square[1]));}
  if(id==='defend-opposition'){const copy=new Chess(p.fen);move(copy,entry.teachingMove);const kings=copy.board().flat().filter(q=>q?.type==='k'),a=kings[0].square,b=kings[1].square,dx=Math.abs(a.charCodeAt(0)-b.charCodeAt(0)),dy=Math.abs(Number(a[1])-Number(b[1]));assert(dx===0&&dy===2||dy===0&&dx===2);}
  if(id==='philidor'){assert.equal(g.get(entry.teachingMove.slice(0,2))?.type,'r');assert.equal(entry.teachingMove[1],'3');assert.equal(entry.teachingMove[3],'3');}
  if(id==='lucena'){assert.equal(g.get('e8')?.type,'k');assert.equal(g.get('e7')?.type,'p');}
  count++;
 }
 console.log(id+': '+positions.length+' verified, distinct relative arrangements');
}
assert.equal(evidence.length,count);console.log('PASS '+count+' positions; all moves legal, material/theme and tablebase provenance checked.');
