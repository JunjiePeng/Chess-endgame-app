import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from '../dist/vendor/chess.mjs';
import {candidateFor,createAdjudication,assessAdjudication} from '../dist/adjudication.mjs';

const promotion={id:'rook-behind-pawn',goal:'promotion'};
const defense={id:'philidor',goal:'draw'};
function played(fen,...moves){
 const game=new Chess(fen);
 for(const u of moves)game.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
 return game;
}
const safeWin=()=>played('8/r5k1/8/3P4/4K3/8/8/R7 w - - 0 1','a1a7');
const clearLoss=()=>played('8/1r6/8/8/8/6k1/P7/1R5K w - - 0 1','b1b6','b7b6');
const lostPawn=()=>played('8/3r2k1/8/8/3P4/8/4K3/R7 w - - 0 1','a1a2','d7d4');
const securedDefense=()=>played('8/3r2k1/8/8/R2p4/4K3/8/8 w - - 0 1','a4d4');
function analyses(game,values,type='cp',player='w',depth=16){
 const sign=game.turn()===player?1:-1;
 return values.map(value=>({evaluation:{type,value:value*sign},depth}));
}
function confirms(game,lesson,values,type='cp',player='w'){
 return createAdjudication(game,lesson,player,analyses(game,values,type,player));
}

test('winning a rook nominates a milestone, with two player-normalized strong scores required',()=>{
 const game=safeWin();
 assert.equal(candidateFor(game,promotion,'w'),'decisiveWin');
 assert.equal(game.turn(),'b');
 const evidence=confirms(game,promotion,[800,950]);
 assert.deepEqual(evidence,{version:1,fen:game.fen(),key:'decisiveWin',evaluations:[{type:'cp',value:800,depth:16},{type:'cp',value:950,depth:16}]});
 assert.deepEqual(assessAdjudication(game,promotion,'w',evidence),{finished:true,success:true,key:'decisiveWin'});
 assert.equal(confirms(game,promotion,[1200,799]),null);
 assert(confirms(game,promotion,[7,6],'mate'));
 assert.equal(confirms(game,promotion,[-7,-6],'mate'),null);
});

test('no starting position, quiet maneuver or mating-technique advantage auto-completes',()=>{
 const start=new Chess('8/r5k1/8/3P4/4K3/8/8/R7 w - - 0 1');
 assert.equal(candidateFor(start,promotion,'w'),null);
 start.move('Kf4');
 assert.equal(candidateFor(start,promotion,'w'),null);
 assert.equal(candidateFor(safeWin(),{id:'rook-mate',goal:'mate'},'w'),null);
 assert.equal(candidateFor(played('7k/8/5KQ1/8/8/8/8/8 w - - 0 1','g6g7'),promotion,'w'),null,'terminal mate belongs to the shared baseline');
});

test('a hanging won rook or underpromoted rook is never an early win',()=>{
 // Rxb7+ only reaches a drawn pawn ending after Kxb7.
 const game=played('8/kr6/8/8/8/P7/8/1R5K w - - 0 1','b1b7');
 assert.equal(candidateFor(game,promotion,'w'),null);
 assert.equal(confirms(game,promotion,[2000,2000]),null);
 const under=played('8/1Pk5/8/8/8/8/8/5K2 w - - 0 1','b7b8r');
 assert.equal(candidateFor(under,{id:'rook-underpromotion',goal:'mate'},'w'),null);
});

test('material-loss confirmations defer to immediate recaptures and promotion escapes',()=>{
 const loss=clearLoss();
 assert.equal(candidateFor(loss,promotion,'w'),'decisiveLoss');
 assert(confirms(loss,promotion,[-650,-900]));
 assert.equal(confirms(loss,promotion,[-1000,-649]),null);
 assert(confirms(loss,promotion,[-1,-1],'mate'));
 assert.equal(confirms(loss,promotion,[1,1],'mate'),null);
 const recapture=played('8/3r2k1/8/8/8/2P5/4K3/R7 w - - 0 1','a1d1','d7d1');
 assert(recapture.moves({verbose:true}).some(m=>m.san==='Kxd1'));
 assert.equal(candidateFor(recapture,promotion,'w'),null);
 const escape=played('7k/2P5/7r/4K3/8/8/8/R7 w - - 0 1','a1a6','h6a6');
 assert.equal(candidateFor(escape,promotion,'w'),null);
 assert.equal(confirms(escape,promotion,[-5000,-5000]),null);
});

test('an equal rook exchange is not a significant net material loss',()=>{
 const game=played('rk6/8/8/8/8/8/7P/R5K1 w - - 0 1','a1a8','b8a8');
 assert.equal(candidateFor(game,promotion,'w'),null);
 assert.equal(confirms(game,promotion,[-1000,-1000]),null);
});

test('opponent promotion can nominate a loss without a capture',()=>{
 const game=played('6k1/8/8/8/8/8/7p/R5K1 w - - 0 1','g1f1','h2h1q');
 assert.equal(candidateFor(game,promotion,'w'),'decisiveLoss');
 assert(confirms(game,promotion,[-900,-1200]));
});

test('losing the last pawn in equal bare-rook material needs a non-winning evaluation',()=>{
 const game=lostPawn();
 assert.equal(candidateFor(game,promotion,'w'),'objectiveLost');
 const evidence=confirms(game,promotion,[0,50]);
 assert.deepEqual(assessAdjudication(game,promotion,'w',evidence),{finished:true,success:false,key:'objectiveLost'});
 assert.equal(confirms(game,promotion,[0,51]),null);
 assert(confirms(game,promotion,[-10,-9],'mate'));
 assert.equal(confirms(game,promotion,[10,9],'mate'),null);
 assert.equal(candidateFor(game,{id:'rook-mate',goal:'mate'},'w'),null);
 const extraPawn=played('8/3r2k1/8/8/3P3P/8/4K3/R7 w - - 0 1','a1a2','d7d4');
 assert.equal(candidateFor(extraPawn,promotion,'w'),null);
});

test('neutralizing the enemy pawn can secure a draw, and winning evaluations also count',()=>{
 const game=securedDefense();
 assert.equal(candidateFor(game,defense,'w'),'defenseSecured');
 assert(confirms(game,defense,[-30,0]));
 assert(confirms(game,defense,[1000,1200]));
 assert(confirms(game,defense,[4,3],'mate'));
 assert.equal(confirms(game,defense,[-31,0]),null);
 assert.equal(confirms(game,defense,[-4,-3],'mate'),null);
 const hanging=played('8/3r2k1/8/8/R2p4/8/8/4K3 w - - 0 1','a4d4');
 assert.equal(candidateFor(hanging,defense,'w'),'defenseSecured');
 assert.equal(confirms(hanging,defense,[-14,-13],'mate'),null,'a nominal simplification is not itself a result');
});

test('the two special technique lessons can finish when their material milestone is safe',()=>{
 const stopped=played('7k/8/8/8/R2p4/4K3/8/8 w - - 0 1','a4d4');
 assert.equal(candidateFor(stopped,{id:'stop-the-passer',goal:'mate'},'w'),'decisiveWin');
 assert(confirms(stopped,{id:'stop-the-passer',goal:'mate'},[800,900]));
 const rook=played('8/k1P5/2K5/8/8/8/8/8 w - - 0 1','c7c8r');
 assert.equal(candidateFor(rook,{id:'rook-underpromotion',goal:'mate'},'w'),'decisiveWin');
 const stalemate=played('8/k1P5/2K5/8/8/8/8/8 w - - 0 1','c7c8q');
 assert.equal(candidateFor(stalemate,{id:'rook-underpromotion',goal:'mate'},'w'),null);
});

test('later quiet plies retain the material milestone but invalidate evidence for the old board',()=>{
 const game=safeWin(),evidence=confirms(game,promotion,[800,900]);
 game.move('Kf6');
 assert.equal(candidateFor(game,promotion,'w'),'decisiveWin');
 assert.equal(assessAdjudication(game,promotion,'w',evidence),null);
 assert(confirms(game,promotion,[900,1000]));
 game.undo();assert(assessAdjudication(game,promotion,'w',evidence));
 game.undo();assert.equal(assessAdjudication(game,promotion,'w',evidence),null);
});

test('evidence rejects stale identity, mismatched reasons, invalid scores and shallow or bounded searches',()=>{
 const game=safeWin(),valid=confirms(game,promotion,[900,1000]);
 const mutations=[
  e=>{e.version=2;},e=>{e.fen=e.fen.replace(' 0 1',' 1 1');},e=>{e.key='defenseSecured';},
  e=>{e.evaluations.pop();},e=>{e.evaluations.push({...e.evaluations[0]});},
  e=>{e.evaluations[0].value=NaN;},e=>{e.evaluations[0].value=Infinity;},
  e=>{e.evaluations[0].value=900.5;},e=>{e.evaluations[0].type='pawns';},
  e=>{e.evaluations[0].depth=11;},e=>{delete e.evaluations[0].depth;},
  e=>{e.evaluations[0].bound='lowerbound';},e=>{e.evaluations[0].exact=false;},
  e=>{e.evaluations[0]={type:'mate',value:0,depth:16};},
  e=>{e.evaluations[0].value=-900;e.success=true;e.finished=true;}
 ];
 for(const mutate of mutations){const e=structuredClone(valid);mutate(e);assert.equal(assessAdjudication(game,promotion,'w',e),null);}
 assert.equal(createAdjudication(game,promotion,'w',[{evaluation:{type:'cp',value:-900},depth:12}]),null);
 for(const changes of [{depth:11},{bound:'upperbound'},{exact:false},{evaluation:{type:'cp',value:-900,lowerbound:true}}]){
  const samples=analyses(game,[900,1000]);Object.assign(samples[0],changes);
  assert.equal(createAdjudication(game,promotion,'w',samples),null);
 }
 assert(createAdjudication(game,promotion,'w',analyses(game,[800,800],'cp','w',12)));
});

test('the same decisive material change works when the learner plays Black',()=>{
 const fen='r7/8/8/4k3/3p4/8/R5K1/8 b - - 0 1';
 const game=played(fen,'a8a2');
 assert.equal(game.turn(),'w');
 assert.equal(candidateFor(game,promotion,'b'),'decisiveWin');
 const evidence=confirms(game,promotion,[800,900],'cp','b');
 assert.deepEqual(assessAdjudication(game,promotion,'b',evidence),{finished:true,success:true,key:'decisiveWin'});
 assert.equal(assessAdjudication(game,promotion,'w',evidence),null);
});


test('losing one of two rooks against a bare king does not keep requesting loss checks',()=>{
 const game=played('8/8/4k3/8/8/6K1/8/RR6 w - - 0 1','b1e1','e6f5','e1e5','f5e5');
 assert.equal(candidateFor(game,{id:'ladder-mate',goal:'mate'},'w'),null);
 assert.equal(game.isGameOver(),false);
});
