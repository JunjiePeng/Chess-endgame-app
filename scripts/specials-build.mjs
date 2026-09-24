// Authoring only: node scripts/specials-build.mjs regenerates the module and evidence.
// Optional SPECIALS_TABLEBASE_IP overrides DNS while retaining HTTPS hostname validation.
// SPECIALS_CACHE_ONLY=1 uses saved responses; missing required seeds aborts artifact writes.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {Chess} from '../dist/vendor/chess.mjs';
import {lessons} from '../dist/lessons.mjs';
const files='abcdefgh';
function fen(pieces){const rows=Array.from({length:8},()=>Array(8).fill('1'));for(const [square,piece]of Object.entries(pieces))rows[8-Number(square[1])][files.indexOf(square[0])]=piece;return rows.map(r=>r.join('').replace(/1+/g,m=>String(m.length))).join('/')+' w - - 0 1';}
function legal(position){try{const g=new Chess(position),king=g.board().flat().find(p=>p?.color==='b'&&p.type==='k');return !g.isAttacked(king.square,'w')&&!g.isGameOver();}catch{return false;}}
function shape(position){const pieces=new Chess(position).board().flat().filter(Boolean).map(p=>({type:p.color+p.type,x:files.indexOf(p.square[0]),y:Number(p.square[1])}));const minX=Math.min(...pieces.map(p=>p.x)),minY=Math.min(...pieces.map(p=>p.y)),maxX=Math.max(...pieces.map(p=>p.x));return [false,true].map(mirror=>pieces.map(p=>`${p.type}:${mirror?maxX-p.x:p.x-minX},${p.y-minY}`).sort().join('|')).sort()[0];}
const candidates={};
const add=(id,pieces,extra={})=>{const position=typeof pieces==='string'?pieces:fen(pieces);if(legal(position))(candidates[id]??=[]).push({fen:position,...extra});};
for(const p of [{"fen":"8/1P6/8/8/8/8/8/5K1k w - - 0 1","wk":"f1","bk":"h1","pawn":"b7","queen":"b7b8q","rook":"b7b8r"},{"fen":"8/1P6/8/8/8/8/5K2/7k w - - 0 1","wk":"f2","bk":"h1","pawn":"b7","queen":"b7b8q","rook":"b7b8r"},{"fen":"8/1P6/k7/8/K7/8/8/8 w - - 0 1","wk":"a4","bk":"a6","pawn":"b7","queen":"b7b8q","rook":"b7b8r"},{"fen":"8/1P6/k7/8/1K6/8/8/8 w - - 0 1","wk":"b4","bk":"a6","pawn":"b7","queen":"b7b8q","rook":"b7b8r"},{"fen":"8/k1P5/8/K7/8/8/8/8 w - - 0 1","wk":"a5","bk":"a7","pawn":"c7","queen":"c7c8q","rook":"c7c8r"},{"fen":"8/k1P5/8/1K6/8/8/8/8 w - - 0 1","wk":"b5","bk":"a7","pawn":"c7","queen":"c7c8q","rook":"c7c8r"},{"fen":"8/k1P5/8/2K5/8/8/8/8 w - - 0 1","wk":"c5","bk":"a7","pawn":"c7","queen":"c7c8q","rook":"c7c8r"}])add('rook-underpromotion',p.fen,{queen:p.queen,rook:p.rook,pawn:p.pawn});
for(const [king,rook] of [['d4','g1'],['e4','g2'],['d5','g3'],['e5','g4'],['f5','g2'],['c6','g5'],['d6','g6'],['f6','g1'],['c3','g4'],['e3','g5'],['b4','g1'],['d2','g4'],['f3','g5'],['d7','g2']]){
 const pieces={[king]:'K',[rook]:'R',f7:'P',h7:'k',h8:'b',h6:'p'};if(Object.keys(pieces).length!==6)continue;const position=fen(pieces);if(!legal(position))continue;const g=new Chess(position);try{g.move({from:'f7',to:'f8',promotion:'n'});}catch{continue;}if(g.isCheckmate())add('knight-underpromotion',position,{knight:'f7f8n'});
}
for(const [king,pawn,rook] of [['c3','a4','a1'],['c4','a3','a1'],['c4','a4','a1'],['b4','a3','a1'],['c5','a4','a1'],['c3','a5','a1'],['d4','a3','a1'],['c5','a5','a1'],['c4','a5','b1'],['c3','a4','b1'],['c4','a6','a1'],['b5','a4','a1']])add('rook-pawn-corner',{[rook]:'K',[king]:'k',[pawn]:'p'});
for(const [wk,bk,pawn,bishop] of [['a1','c3','a3','f7'],['a1','c4','a3','d5'],['a1','c3','a4','f5'],['a1','b4','a4','d7'],['a1','c5','a3','h5'],['b1','c3','a3','e6'],['a1','c4','a4','d3'],['a1','d4','a5','c4'],['a1','c5','a4','h7'],['a1','b5','a4','f3']])add('wrong-bishop',{[wk]:'K',[bk]:'k',[pawn]:'p',[bishop]:'b'});
for(const [wk,bk,pawn]of [['d1','e4','e5'],['d2','e4','e5'],['d3','d6','e7'],['e2','d5','e6'],['e2','d4','e5'],['d2','c4','e5'],['d2','c5','e5'],['d3','c5','e5'],['d3','c6','e5'],['d3','e6','e5'],['d2','d4','e4'],['c2','c4','d5'],['c2','b4','d5'],['c3','b5','d5'],['e2','d5','e5'],['d2','c5','d5']])add('defend-opposition',{[wk]:'K',[bk]:'k',[pawn]:'p'});
for(const [wr,br,bk,pawn] of [['b3','h2','e4','e5'],['c3','a2','e4','e5'],['f3','h2','e4','e5'],['g3','a2','e4','e5'],['h3','b2','e4','e5'],['a3','h8','e4','e5'],['b3','g7','e4','e6'],['h3','a7','e4','e6'],['c3','h7','f4','e5'],['a3','g8','d4','e5'],['g3','b7','e4','e5']])add('philidor',{e1:'K',[wr]:'R',[br]:'r',[bk]:'k',[pawn]:'p'});
for(const [wr,br,bk] of [['a2','b1','g7'],['a3','b2','g7'],['a4','c2','g7'],['a5','b3','g7'],['b1','a3','h7'],['c1','b2','g8'],['a1','c4','h8'],['b4','a2','g7'],['a6','c2','h7'],['c3','b1','h8'],['b1','c3','g8'],['a2','b5','h8']])add('lucena',{e8:'K',e7:'P',[wr]:'R',[br]:'r',[bk]:'k'});
for(const [wk,wr,bk,br,pawn] of [['f6','e2','g8','b7','e6'],['f6','e3','h8','a7','e6'],['d6','e1','g8','h7','e6'],['d6','e2','h8','b7','e6'],['f5','e1','g8','b7','e6'],['d5','e2','h8','c7','e6'],['f6','e4','h8','b7','e6'],['d6','e3','g8','a7','e6'],['f5','e2','h8','a7','e6'],['d6','e1','a8','h7','e6'],['f6','e1','h8','c7','e7'],['d6','e2','g8','b7','e7']])add('rook-behind-pawn',{[wk]:'K',[wr]:'R',[bk]:'k',[br]:'r',[pawn]:'P'});
for(const [wk,wr,bk,pawn] of [['e3','a2','g3','h3'],['e3','b1','g3','h3'],['e4','a1','g3','h3'],['e2','a1','g3','h3'],['d3','a1','g3','h3'],['e3','c2','g3','h3'],['e3','b2','g3','h3'],['d4','c1','g3','h3'],['e4','a2','g3','h3'],['e3','c1','g4','h3'],['e4','b1','g4','h4'],['e2','b1','g3','h4'],['d3','c1','g4','h3'],['e4','b2','g3','h3'],['f4','a1','h3','h2'],['e3','c1','g3','h3']])add('stop-the-passer',{[wk]:'K',[wr]:'R',[bk]:'k',[pawn]:'p'});
const cachePath=process.env.SPECIALS_TABLEBASE_CACHE||'/tmp/specials-tablebase-cache.json';let cache={};try{cache=JSON.parse(fs.readFileSync(cachePath,'utf8'));}catch{}
async function query(position){if(cache[position])return cache[position];if(process.env.SPECIALS_CACHE_ONLY)return {category:'unknown',moves:[]};let error;for(let n=0;n<4;n++){try{const url='https://tablebase.lichess.ovh/standard?fen='+encodeURIComponent(position);const output=execFileSync('curl',['-sS','--fail','--max-time','30',...(process.env.SPECIALS_TABLEBASE_IP?['--resolve','tablebase.lichess.ovh:443:'+process.env.SPECIALS_TABLEBASE_IP]:[]),url],{encoding:'utf8'});const data=JSON.parse(output);cache[position]={...data,queriedAt:new Date().toISOString(),source:url};fs.writeFileSync(cachePath,JSON.stringify(cache));await new Promise(r=>setTimeout(r,350));return cache[position];}catch(e){error=e;await new Promise(r=>setTimeout(r,(n+1)*1500));}}throw error;}
const specials={},evidence=[];
for(const [id,list]of Object.entries(candidates).sort(([a],[b])=>(a==='defend-opposition')-(b==='defend-opposition'))){
 const l=lessons.find(l=>l.id===id),wanted=l.goal==='draw'?'draw':'win',seen=new Set([shape(l.fen)]);specials[id]=[];
 for(const candidate of list){
  if(specials[id].length===8)break;
  if(seen.has(shape(candidate.fen)))continue;
  const g=new Chess(candidate.fen);
  const oppositionMove=m=>{const blackKing=g.board().flat().find(p=>p?.color==='b'&&p.type==='k').square,sq=m.uci.slice(2,4),dx=Math.abs(files.indexOf(sq[0])-files.indexOf(blackKing[0])),dy=Math.abs(Number(sq[1])-Number(blackKing[1]));return !m.san.includes('x')&&(dx===0&&dy>0&&dy%2===0||dy===0&&dx>0&&dx%2===0);};
  if(id==='defend-opposition'&&!g.moves({verbose:true}).some(m=>oppositionMove({uci:m.from+m.to,san:m.san})))continue;
  // Child move categories are from the opponent's perspective.
  const r=await query(candidate.fen),preserving=r.moves.filter(m=>m.category===(wanted==='draw'?'draw':'loss'));
  if(r.category!==wanted||!preserving.length){console.log('reject',id,r.category,candidate.fen);continue;}
  let best=preserving[0];
  if(id==='defend-opposition'){
   const choices=preserving.filter(oppositionMove);
   if(!choices.length)continue;const blackKing=g.board().flat().find(p=>p?.color==='b'&&p.type==='k').square;choices.sort((a,b)=>{const distance=m=>Math.abs(files.indexOf(m.uci[2])-files.indexOf(blackKing[0]))+Math.abs(Number(m.uci[3])-Number(blackKing[1]));return distance(a)-distance(b);});best=choices[0];
  }
  if(id==='rook-pawn-corner'||id==='wrong-bishop'){if(preserving.some(m=>m.san.includes('x')))continue;}
  if(id==='philidor'){
   const wr=g.board().flat().find(p=>p?.color==='w'&&p.type==='r').square;
   const choices=preserving.filter(m=>m.uci.startsWith(wr)&&m.uci[3]==='3'&&!m.san.includes('x'));if(!choices.length)continue;best=choices[0];
  }
  const extra={};
  if(id==='rook-underpromotion'){
   const q=r.moves.find(m=>m.uci===candidate.queen),rook=r.moves.find(m=>m.uci===candidate.rook);
   if(!q?.stalemate||q.category!=='draw'||rook?.category!=='loss')continue;best=rook;extra.queenPromotion={uci:q.uci,category:q.category,stalemate:q.stalemate};extra.rookPromotion={uci:rook.uci,category:rook.category};
  }
  if(id==='knight-underpromotion'){
   const knight=r.moves.find(m=>m.uci===candidate.knight);if(!knight?.checkmate)continue;best=knight;extra.knightPromotion={uci:knight.uci,checkmate:true};
  }
  const positionId='s'+String(specials[id].length+1).padStart(2,'0'),san=best.san;
  let hint,zh;
  switch(id){
   case 'lucena':hint=`Try ${san}. Use your rook to shelter your king as it leaves e8 and clears the e-pawn’s path.`;zh=`考虑 ${san}。让车为离开 e8 的王挡将，打开 e 兵的升变路线。`;break;
   case 'rook-behind-pawn':hint=`Consider ${san}. Your rook supports the e-pawn from behind; keep it coordinated with your king.`;zh=`考虑 ${san}。车从后方支援 e 兵，要保持王车配合。`;break;
   case 'stop-the-passer':hint=`Look at ${san}. Stop the h-pawn before turning your rook advantage into checkmate.`;zh=`考虑 ${san}。先拦住 h 兵，再把多车优势转化为将杀。`;break;
   case 'rook-underpromotion':{const square=candidate.rook.slice(2,4);hint=`Compare ${square}=Q with ${square}=R. The queen stalemates; a rook keeps a winning position.`;zh=`比较 ${square}=Q 和 ${square}=R。升后会逼和，升车则保留胜势。`;break;}
   case 'knight-underpromotion':hint='The rook guards the g-file. Promote on f8 to a piece that checks the king on h7 immediately.';zh='车守住 g 线。在 f8 升变成能够立即将军 h7 王的棋子。';break;
   case 'defend-opposition':hint=`${san} holds the draw by taking the opposition. Stay in front of the pawn and answer the attacking king.`;zh=`${san} 取得对峙，保住和棋。守在兵的前面，紧跟进攻王的动向。`;break;
   case 'rook-pawn-corner':hint=`${san} preserves the draw. Keep access to a1; the promotion corner is your shelter.`;zh=`${san} 可以守和。保留返回 a1 的路线，升变角就是你的堡垒。`;break;
   case 'wrong-bishop':hint=`The bishop cannot control a1. ${san} keeps the position drawn; protect your route to the corner.`;zh=`象无法控制 a1。${san} 保持和棋，要守住通向角落的路线。`;break;
   case 'philidor':hint=`Try ${san} to hold the draw. Guard the third rank until the pawn advances, then check from behind.`;zh=`考虑 ${san} 守和。兵推进之前守住第三横线，之后再从后方将军。`;break;
  }
  specials[id].push({id:positionId,fen:candidate.fen,hint,zh:{hint:zh}});seen.add(shape(candidate.fen));
  evidence.push({lessonId:id,positionId,fen:candidate.fen,category:r.category,teachingMove:best.uci,preservingMoves:preserving.map(m=>m.uci),dtz:r.dtz,dtm:r.dtm,...extra,provenance:{provider:'Lichess tablebase',source:r.source,documentation:'https://github.com/lichess-org/lila-tablebase#http-api',queriedAt:r.queriedAt}});
  console.log('accept',id,positionId,san,candidate.fen);
 }
 console.log('COUNT',id,specials[id].length);
 fs.writeFileSync('/tmp/specials-progress.json',JSON.stringify({specials,evidence},null,2));
}
for(const [id,positions]of Object.entries(specials)){const required=id==='rook-underpromotion'?7:8;if(positions.length!==required)throw new Error(id+' needs '+required+' verified seeds; got '+positions.length);}
fs.writeFileSync('dist/positions/specials.mjs','// Diverse teaching positions verified against the Lichess endgame tablebase.\nexport const specialPositions = '+JSON.stringify(specials,null,2)+';\n');
fs.writeFileSync('tests/positions-specials.json',JSON.stringify(evidence,null,2)+'\n');
console.log('FINAL COUNTS',JSON.stringify(Object.fromEntries(Object.entries(specials).map(([id,p])=>[id,p.length]))));
