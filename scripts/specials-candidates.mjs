// Exhaustive local search for K+P vs K promotions: Q stalemate, R nonterminal and safe.
// Outputs candidates for independent tablebase verification; excludes original/mirror.
import fs from 'node:fs';
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
import {variantFen} from '../dist/variants.mjs';
export function fen(pieces){const rows=Array.from({length:8},()=>Array(8).fill('1'));for(const [square,piece]of Object.entries(pieces))rows[8-Number(square[1])]['abcdefgh'.indexOf(square[0])]=piece;return rows.map(r=>r.join('').replace(/1+/g,m=>String(m.length))).join('/')+' w - - 0 1';}
export function legal(position){try{const g=new Chess(position),king=g.board().flat().find(p=>p?.color==='b'&&p.type==='k');return !g.isAttacked(king.square,'w')&&!g.isGameOver();}catch{return false;}}
const squares=Array.from({length:64},(_,i)=>'abcdefgh'[i%8]+(1+Math.floor(i/8)));
const seen=new Set(lessons.map(l=>[l.fen,variantFen(l.fen,1)].sort()[0]));
const result=[];
for(const file of 'abcdefgh')for(const wk of squares)for(const bk of squares){const pawn=file+'7';if(new Set([pawn,wk,bk]).size!==3)continue;const position=fen({[wk]:'K',[bk]:'k',[pawn]:'P'}),canonical=[position,variantFen(position,1)].sort()[0];if(seen.has(canonical)||!legal(position))continue;const q=new Chess(position),r=new Chess(position);try{q.move({from:pawn,to:file+'8',promotion:'q'});r.move({from:pawn,to:file+'8',promotion:'r'});}catch{continue;}
if(q.isStalemate()&&!r.isGameOver()&&!r.moves({verbose:true}).some(m=>m.to===file+'8'&&m.captured)){seen.add(canonical);result.push({fen:position,wk,bk,pawn,queen:file+'7'+file+'8q',rook:file+'7'+file+'8r'});}}
fs.writeFileSync('/tmp/specials-rook-candidates.json',JSON.stringify(result,null,2));console.log('Rook underpromotion non-mirror alternatives:',result.length,JSON.stringify(result));
