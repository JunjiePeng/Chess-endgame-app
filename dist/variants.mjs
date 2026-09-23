const files='abcdefgh',ordinals=['first','second','third','fourth','fifth','sixth','seventh','eighth'],numerals='一二三四五六七八';
// IDs are persisted in saved games: keep these mappings stable.
const transforms=[
 (x,y)=>[x,y],(x,y)=>[7-x,y],(x,y)=>[y,7-x],(x,y)=>[7-x,7-y],
 (x,y)=>[7-y,x],(x,y)=>[x,7-y],(x,y)=>[y,x],(x,y)=>[7-y,7-x]
];
function checkVariant(variant){if(!Number.isInteger(variant)||variant<0||variant>=transforms.length)throw Error('Invalid position variant');}
export function variantIds(lesson){return /[pP]/.test(lesson.fen.split(' ')[0])?[0,1]:[0,1,2,3,4,5,6,7];}
export function transformSquare(square,variant=0){
 checkVariant(variant);if(typeof square!=='string'||!/^[a-h][1-8]$/.test(square))throw Error('Invalid square');
 const [x,y]=transforms[variant](files.indexOf(square[0]),Number(square[1])-1);return files[x]+(y+1);
}
export function variantFen(fen,variant=0){
 checkVariant(variant);if(!variant)return fen;
 const parts=fen.split(' '),board=Array.from({length:8},()=>Array(8).fill('1'));
 if(parts[2]!=='-')throw Error('Position variants require no castling rights');
 parts[0].split('/').forEach((rank,row)=>{
  let x=0;for(const piece of rank){if(/[1-8]/.test(piece)){x+=Number(piece);continue;}
   const [tx,ty]=transforms[variant](x++,7-row);board[7-ty][tx]=piece;
  }
 });
 parts[0]=board.map(rank=>rank.join('').replace(/1+/g,empty=>String(empty.length))).join('/');
 if(parts[3]!=='-')parts[3]=transformSquare(parts[3],variant);
 return parts.join(' ');
}
export function transformLessonText(text,variant=0,language='en'){
 checkVariant(variant);if(!variant)return text;
 const line=(from,to)=>{
  const a=transformSquare(from,variant),b=transformSquare(to,variant);
  return a[0]===b[0]?{file:a[0]}:{rank:Number(a[1])};
 };
 const describe=axis=>axis.file?(language==='zh'?`${axis.file} 线`:`${axis.file}-file`):(language==='zh'?`第${numerals[axis.rank-1]}横线`:`${ordinals[axis.rank-1]} rank`);
 // Replace original references in a single pass, including destinations in
 // SAN such as Rg1+, so a transformed reference is never transformed twice.
 return text.replace(/[a-h][1-8]|[a-h]-(?:file|pawn)\b|\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth) rank\b|[a-h]\s*[线兵]|第[一二三四五六七八1-8]横线/g,token=>{
  if(/^[a-h][1-8]$/.test(token))return transformSquare(token,variant);
  if(/^[a-h](?:-|\s*[线兵])/.test(token)){
   const axis=line(token[0]+'1',token[0]+'8');
   if(/pawn|兵/.test(token))return axis.file?(language==='zh'?`${axis.file} 兵`:`${axis.file}-pawn`):(language==='zh'?`${describe(axis)}上的兵`:`pawn on the ${describe(axis)}`);
   return describe(axis);
  }
  const rank=token[0]==='第'?(numerals.includes(token[1])?numerals.indexOf(token[1])+1:Number(token[1])):ordinals.indexOf(token.split(' ')[0])+1;
  return describe(line('a'+rank,'h'+rank));
 });
}
