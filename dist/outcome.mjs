import {assessAdjudication} from './adjudication.mjs';
// Shared by the practice room and saved-game validation. Engine-confirmed
// milestones are optional, preserving historical games and terminal rules.
export function assessOutcome(game,lesson,player,adjudication=null){
 if(game.isCheckmate())return {finished:true,success:game.turn()!==player,key:game.turn()!==player?'winMate':'loseMate'};
 if(game.isDraw())return {finished:true,success:lesson.goal==='draw',key:lesson.goal==='draw'?'drawSaved':game.isStalemate()?'stalemate':game.isInsufficientMaterial()?'materialDraw':game.isThreefoldRepetition()?'repetition':'fifty'};
 if(lesson.goal==='promotion'){
  const last=game.history({verbose:true}).at(-1);
  if(last?.color===player&&last.promotion&&!game.moves({verbose:true}).some(m=>m.to===last.to&&m.captured))return {finished:true,success:true,key:'promoted'};
  if(!game.board().flat().some(p=>p?.color===player&&['p','q','r'].includes(p.type)))return {finished:true,success:false,key:'pawnGone'};
 }
 return assessAdjudication(game,lesson,player,adjudication)||{finished:false,success:false,key:null};
}
