import test from 'node:test';
import assert from 'node:assert/strict';
import {wireBoardPointer} from '../dist/board-effects.mjs';

function fixture({playable=true,mine=true,markMode=false,onNormalPointer=true}={}){
 const handlers={},calls=[],drawings=[{from:'a1',to:'a8'}],selected=[],moves=[],marks=[];
 const square=name=>({dataset:{square:name},closest(){return this;},classList:{add(){},remove(){}}});
 const children=Array.from({length:64},(_,i)=>square('abcdefgh'[i%8]+(8-Math.floor(i/8))));
 const board={
  children,addEventListener:(name,fn)=>handlers[name]=fn,
  querySelectorAll:()=>[],querySelector:selector=>selector.endsWith(' img')?{outerHTML:'<img>'}:children.find(s=>selector.includes('"'+s.dataset.square+'"')),
  setPointerCapture(){},releasePointerCapture(){},
  getBoundingClientRect:()=>({left:0,top:0,right:800,bottom:800,width:800,height:800})
 };
 const pointer=wireBoardPointer({
  board,ghost:{hidden:true,style:{}},canMove:()=>{calls.push('canMove');return playable&&!markMode;},isMine:()=>{calls.push('isMine');return mine;},
  select:s=>selected.push(s),move:(from,to)=>moves.push({from,to}),mark:(from,to)=>marks.push({from,to}),onCancel(){},getRevision:()=>0,
  ...(onNormalPointer?{onNormalPointer:s=>{calls.push('normal:'+s);if(!markMode)drawings.length=0;}}:{})
 });
 const event=(name,{button=0,pointerType='mouse'}={})=>({
  button,pointerType,pointerId:1,clientX:('abcdefgh'.indexOf(name[0])+.5)*100,clientY:(8-Number(name[1])+.5)*100,
  target:children.find(s=>s.dataset.square===name),preventDefault(){}
 });
 return {handlers,calls,drawings,selected,moves,marks,pointer,event};
}

for(const position of ['empty','enemy'])test('a primary click on an '+position+' square clears drawings before checking ownership',()=>{
 const state=fixture({mine:false});state.handlers.pointerdown(state.event('e4'));
 assert.deepEqual(state.calls,['normal:e4','canMove','isMine']);assert.deepEqual(state.drawings,[]);assert.deepEqual(state.selected,[]);
});

for(const position of ['finished','review'])test('a primary click clears drawings in a '+position+' position',()=>{
 const state=fixture({playable:false});state.handlers.pointerdown(state.event('e4'));
 assert.deepEqual(state.calls,['normal:e4','canMove']);assert.deepEqual(state.drawings,[]);assert.deepEqual(state.selected,[]);
});

test('primary piece selection keeps click-to-move destination clicks available',()=>{
 const state=fixture(),source=state.event('e4');state.handlers.pointerdown(source);state.handlers.pointerup(source);
 assert.deepEqual(state.drawings,[]);assert.deepEqual(state.selected,['e4']);assert.deepEqual(state.moves,[]);
 assert.equal(state.pointer.ignoreClick({detail:1,target:state.event('e5').target}),false);
});

test('primary dragging clears drawings and still moves the selected piece',()=>{
 const state=fixture();state.handlers.pointerdown(state.event('e4'));state.handlers.pointermove(state.event('e5'));state.handlers.pointerup(state.event('e5'));
 assert.deepEqual(state.drawings,[]);assert.deepEqual(state.selected,['e4']);assert.deepEqual(state.moves,[{from:'e4',to:'e5'}]);
 assert.equal(state.pointer.ignoreClick({detail:1,target:state.event('e5').target}),true);
});

test('touch Mark mode can preserve drawings and handle its normal square click',()=>{
 const state=fixture({markMode:true}),event=state.event('e4',{pointerType:'touch'});
 state.handlers.pointerdown(event);state.handlers.pointerup(event);
 assert.deepEqual(state.calls,['normal:e4','canMove']);assert.equal(state.drawings.length,1);assert.deepEqual(state.selected,[]);
 assert.equal(state.pointer.ignoreClick({detail:1,target:event.target}),false);
});

test('right-click circles and arrows preserve drawings even when moves are disabled',()=>{
 const state=fixture({playable:false,mine:false}),from=state.event('e4',{button:2}),to=state.event('f5',{button:2});
 state.handlers.pointerdown(from);state.handlers.pointerup(from);
 state.handlers.pointerdown(from);state.handlers.pointermove(to);state.handlers.pointerup(to);
 assert.deepEqual(state.calls,[]);assert.equal(state.drawings.length,1);assert.deepEqual(state.selected,[]);assert.deepEqual(state.moves,[]);
 assert.deepEqual(state.marks,[{from:'e4',to:'e4'},{from:'e4',to:'f5'}]);
});

test('non-primary buttons and pointers outside squares do not clear drawings',()=>{
 const state=fixture();state.handlers.pointerdown(state.event('e4',{button:1}));
 state.handlers.pointerdown({...state.event('e4'),target:{closest:()=>null}});
 assert.deepEqual(state.calls,[]);assert.equal(state.drawings.length,1);
});

test('existing pointer integrations work without the optional clearing callback',()=>{
 const state=fixture({onNormalPointer:false}),event=state.event('e4');state.handlers.pointerdown(event);state.handlers.pointerup(event);
 assert.deepEqual(state.selected,['e4']);assert.equal(state.drawings.length,1);
});
