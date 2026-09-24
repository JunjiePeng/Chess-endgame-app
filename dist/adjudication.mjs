import {Chess} from './vendor/chess.mjs';

const values={p:1,n:3,b:3,r:5,q:9,k:0};
const winKeys=new Set(['decisiveWin','defenseSecured']);
const minimumDepth=12;

function material(game,color){
 const counts={p:0,n:0,b:0,r:0,q:0,k:0};
 for(const piece of game.board().flat())if(piece?.color===color)counts[piece.type]++;
 return {counts,value:Object.entries(counts).reduce((sum,[type,n])=>sum+values[type]*n,0)};
}
function equalBareRooks(own,other){
 return [own,other].every(({counts:c})=>c.r===1&&c.k===1&&c.p+c.n+c.b+c.q===0);
}
function opponentCanTakeMajor(game,player){
 const fen=game.fen().split(' ');
 fen[1]=player==='w'?'b':'w';fen[3]='-';
 return new Chess(fen.join(' ')).moves({verbose:true}).some(move=>move.captured==='r'||move.captured==='q');
}

// Material changes only nominate a position. Two strong, exact engine scores
// must separately confirm the result; a material imbalance alone never ends it.
export function candidateFor(game,lesson,player){
 if(!['w','b'].includes(player)||game.isGameOver())return null;
 const history=game.history({verbose:true});
 if(!history.length)return null;
 const opponent=player==='w'?'b':'w',initial=new Chess(history[0].before);
 const own=material(game,player),other=material(game,opponent);
 const startOwn=material(initial,player),startOther=material(initial,opponent);
 if(JSON.stringify(own.counts)===JSON.stringify(startOwn.counts)&&JSON.stringify(other.counts)===JSON.stringify(startOther.counts))return null;
 const ownLoss=startOwn.value-own.value;
 const netGain=(own.value-other.value)-(startOwn.value-startOther.value);
 const majorLost=other.counts.r<startOther.counts.r||other.counts.q<startOther.counts.q;
 const opponentPromoted=history.some(move=>move.color===opponent&&['r','q'].includes(move.promotion));
 const canWinEarly=lesson.goal==='promotion'||lesson.goal==='draw'||['stop-the-passer','rook-underpromotion'].includes(lesson.id);
 const stoppedPasser=lesson.id==='stop-the-passer'&&startOther.counts.p>0&&other.counts.p===0&&own.counts.r>0;
 const choseRook=lesson.id==='rook-underpromotion'&&own.counts.r>0&&history.some(move=>move.color===player&&move.promotion==='r');
 if(canWinEarly&&(netGain>=3&&majorLost||stoppedPasser||choseRook)&&!opponentCanTakeMajor(game,player))return 'decisiveWin';
 // A bare enemy king cannot win; losing one of two rooks still leaves a
 // useful mating exercise, without repeated loss analyses on every move.
 if(other.value>0&&netGain<=-3&&(ownLoss>=3||opponentPromoted)){
  const last=history.at(-1),moves=game.turn()===player?game.moves({verbose:true}):[];
  if(!moves.some(move=>move.promotion||move.captured&&move.to===last.to))return 'decisiveLoss';
 }
 if(equalBareRooks(own,other)){
  if(lesson.goal==='promotion'&&startOwn.counts.p>0&&own.counts.p===0)return 'objectiveLost';
  if(lesson.goal==='draw'&&startOther.counts.p>0&&other.counts.p===0)return 'defenseSecured';
 }
 return null;
}

function exactScore(score){
 return score&&typeof score==='object'&&!Array.isArray(score)&&
  ['cp','mate'].includes(score.type)&&Number.isSafeInteger(score.value)&&Math.abs(score.value)<=1000000&&
  (score.type!=='mate'||score.value!==0)&&Number.isSafeInteger(score.depth)&&score.depth>=minimumDepth&&score.depth<=1000&&
  score.bound===undefined&&score.lowerbound===undefined&&score.upperbound===undefined&&score.exact!==false;
}
function confirms(key,score){
 if(score.type==='mate')return winKeys.has(key)?score.value>0:score.value<0;
 return key==='decisiveWin'?score.value>=800:
  key==='decisiveLoss'?score.value<=-650:
  key==='objectiveLost'?score.value<=50:
  key==='defenseSecured'?score.value>=-30:false;
}

export function assessAdjudication(game,lesson,player,evidence){
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence)||evidence.version!==1||evidence.fen!==game.fen())return null;
 const key=candidateFor(game,lesson,player);
 if(!key||evidence.key!==key||!Array.isArray(evidence.evaluations)||evidence.evaluations.length!==2||
  !evidence.evaluations.every(score=>exactScore(score)&&confirms(key,score)))return null;
 return {finished:true,success:winKeys.has(key),key};
}

// analyze() reports scores from the side to move. Saved scores always use the
// learner's perspective, so restore/import validation needs no running engine.
export function createAdjudication(game,lesson,player,analyses){
 const key=candidateFor(game,lesson,player);
 if(!key||!Array.isArray(analyses)||analyses.length!==2)return null;
 const sign=game.turn()===player?1:-1,evaluations=[];
 for(const analysis of analyses){
  if(!analysis||typeof analysis!=='object'||analysis.bound!==undefined||analysis.lowerbound!==undefined||analysis.upperbound!==undefined||analysis.exact===false)return null;
  const score={...analysis.evaluation,depth:analysis.depth};
  if(!exactScore(score))return null;
  evaluations.push({type:score.type,value:score.value*sign,depth:score.depth});
 }
 const evidence={version:1,fen:game.fen(),key,evaluations};
 return assessAdjudication(game,lesson,player,evidence)?evidence:null;
}
