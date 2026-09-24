import test from 'node:test';
import assert from 'node:assert/strict';
import {setupMobileUI} from '../dist/mobile.mjs';

function replaceGlobal(t,name,value){
 const previous=Object.getOwnPropertyDescriptor(globalThis,name);
 Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
 t.after(()=>previous?Object.defineProperty(globalThis,name,previous):delete globalThis[name]);
}

function fixture(t,{mobile=true}={}){
 const nodes=new Map(),pendingClose=[],mediaListeners=[],scrolls=[];
 let activeElement=null,progressShows=0;
 class Node{
  constructor(id='',{tag='div',dataset={},comment=false}={}){
   this.id=id;this.tagName=tag.toUpperCase();this.nodeType=comment?8:1;this.dataset={...dataset};this.children=[];this.parentNode=null;
   this.listeners=new Map();this.attributes=new Map();this.open=false;this.value='';this.scrollTop=0;
   const classes=new Set();this.classList={add:name=>classes.add(name),contains:name=>classes.has(name)};
   if(id)nodes.set(id,this);
  }
  get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]??null;}
  remove(){if(this.parentNode){this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null;}}
  append(...children){for(const child of children){child.remove();this.children.push(child);child.parentNode=this;}}
  before(child){const parent=this.parentNode;child.remove();parent.children.splice(parent.children.indexOf(this),0,child);child.parentNode=parent;}
  after(child){const parent=this.parentNode;child.remove();parent.children.splice(parent.children.indexOf(this)+1,0,child);child.parentNode=parent;}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  removeAttribute(name){this.attributes.delete(name);}
  getAttribute(name){return this.attributes.get(name)??null;}
  matches(selector){
   if(selector==='[data-mobile]')return Object.hasOwn(this.dataset,'mobile');
   if(selector==='[data-lesson]')return Object.hasOwn(this.dataset,'lesson');
   if(selector==='[tabindex="0"]')return this.getAttribute('tabindex')==='0';
   if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));
   return false;
  }
  closest(selector){for(let node=this;node;node=node.parentNode)if(node.matches(selector))return node;return null;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
  addEventListener(name,callback){if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(callback);}
  dispatch(name,{bubbles=false}={}){
   const event={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};
   // The browser fixes the event path before dispatch, even if a handler moves
   // its target from the dialog back into the desktop layout.
   const path=[this];if(bubbles)for(let node=this.parentNode;node;node=node.parentNode)path.push(node);
   for(const node of path){event.currentTarget=node;node['on'+name]?.(event);for(const listener of node.listeners.get(name)||[])listener(event);}
   return event;
  }
  click(){this.dispatch('click',{bubbles:true});}
  focus(){activeElement=this;}
  scrollIntoView(options){scrolls.push({node:this,options});}
  showModal(){this.open=true;}
  close(){if(!this.open)return;this.open=false;pendingClose.push(()=>this.dispatch('close'));}
  requestClose(){if(!this.dispatch('cancel').defaultPrevented)this.close();}
 }
 const body=new Node('body'),layout=new Node('layout'),library=new Node('library'),workspace=new Node('workspace'),practice=new Node('practice-layout'),playArea=new Node('play-area'),coach=new Node('coach'),afterCoach=new Node('after-coach');
 playArea.classList.add('play-area');body.append(layout);layout.append(library,workspace);workspace.append(practice);practice.append(playArea,coach,afterCoach);
 const board=new Node('board'),square=new Node('current-square'),title=new Node('exercise-title');square.setAttribute('tabindex','0');board.append(square);playArea.append(title,board);
 const search=new Node('lesson-search'),filter=new Node('group-filter'),exerciseList=new Node('exercise-list'),lesson=new Node('lesson-option',{tag:'button',dataset:{lesson:'opposition'}}),lessonLabel=new Node('lesson-label');
 search.value='pawn';filter.value='Pawn fundamentals';lesson.append(lessonLabel);exerciseList.append(lesson);library.append(search,filter,exerciseList);
 const hint=new Node('hint-btn'),details=new Node('principle-card',{tag:'details'});details.open=false;coach.append(hint,details);
 const nav=new Node('mobile-nav'),buttons={};body.append(nav);
 for(const name of ['board','lessons','coach','progress','settings']){
  const button=new Node('nav-'+name,{tag:'button',dataset:{mobile:name}}),icon=new Node('nav-'+name+'-icon');button.append(icon);nav.append(button);buttons[name]=button;
 }
 buttons.board.setAttribute('aria-current','page');
 const panel=new Node('mobile-panel',{tag:'dialog'}),panelBody=new Node('mobile-panel-body'),panelTitle=new Node('mobile-panel-title'),returnButton=new Node('mobile-panel-return');panel.append(panelTitle,panelBody,returnButton);body.append(panel);
 const shortcut=new Node('mobile-lessons-btn'),settings=new Node('settings-dialog',{tag:'dialog'}),progress=new Node('progress-dialog',{tag:'dialog'});body.append(shortcut,settings,progress);
 const media={matches:mobile,addEventListener:(name,listener)=>{assert.equal(name,'change');mediaListeners.push(listener);}};
 const document={body,get activeElement(){return activeElement;},getElementById:id=>nodes.get(id),createComment:()=>new Node('',{comment:true}),querySelector:selector=>body.querySelector(selector)};
 replaceGlobal(t,'document',document);replaceGlobal(t,'matchMedia',query=>{assert.equal(query,'(max-width: 680px)');return media;});
 const showProgress=()=>{progressShows++;progress.showModal();};
 let language='en';
 const ui=setupMobileUI({translate:key=>`${language}:${key}`,showProgress});
 return {ui,document,nodes,layout,library,workspace,practice,playArea,coach,afterCoach,board,square,title,search,filter,exerciseList,lesson,lessonLabel,hint,details,nav,buttons,panel,panelBody,panelTitle,returnButton,shortcut,settings,progress,scrolls,
  setLanguage:value=>language=value,progressShows:()=>progressShows,
  flushClose(){while(pendingClose.length)pendingClose.shift()();},
  resize(matches){if(media.matches===matches)return;media.matches=matches;for(const listener of mediaListeners)listener({matches});}
 };
}

test('phone panels move and restore the original live controls without losing their state',t=>{
 const f=fixture(t);let hints=0;const handler=()=>hints++;f.hint.onclick=handler;
 assert(f.document.body.classList.contains('mobile-ready'));
 f.buttons.lessons.children[0].click();
 assert.equal(f.panel.open,true);assert.equal(f.library.parentNode,f.panelBody);assert.equal(f.panelTitle.textContent,'en:lessons');assert.equal(f.buttons.lessons.getAttribute('aria-current'),'page');
 f.search.value='rook';f.filter.value='Rook technique';f.returnButton.click();
 assert.equal(f.panel.open,false);assert.equal(f.library.parentNode,f.layout);assert.equal(f.library.nextSibling,f.workspace);assert.equal(f.document.activeElement,f.square);
 f.flushClose();f.buttons.coach.click();f.hint.click();f.details.open=true;f.ui.closePanel();f.flushClose();
 assert.equal(f.coach.parentNode,f.practice);assert.equal(f.coach.nextSibling,f.afterCoach);assert.equal(f.hint.onclick,handler);assert.equal(hints,1);assert.equal(f.details.open,true);
 f.shortcut.click();assert.equal(f.search.value,'rook');assert.equal(f.filter.value,'Rook technique');assert.equal(f.nodes.get('library'),f.library);
});

test('native close and Escape restore nodes, and stale close events do not undo a reopened panel',t=>{
 const f=fixture(t);f.buttons.lessons.click();f.panel.requestClose();f.flushClose();
 assert.equal(f.library.parentNode,f.layout);assert.equal(f.buttons.board.getAttribute('aria-current'),'page');
 f.shortcut.click();f.ui.closePanel();f.buttons.coach.click();
 // close() dispatches its close event later, after the same dialog may reopen.
 f.flushClose();assert.equal(f.panel.open,true);assert.equal(f.coach.parentNode,f.panelBody);assert.equal(f.library.parentNode,f.layout);assert.equal(f.buttons.coach.getAttribute('aria-current'),'page');
 f.panel.close();f.flushClose();assert.equal(f.coach.parentNode,f.practice);f.ui.closePanel();f.ui.closePanel();
 assert.equal(f.library.nextSibling,f.workspace);assert.equal(f.coach.nextSibling,f.afterCoach);assert.equal(f.panelBody.children.length,0);
});

test('desktop resize restores the desktop layout and a subsequent phone open remains usable',t=>{
 const f=fixture(t);f.buttons.coach.click();f.resize(false);
 assert.equal(f.panel.open,false);assert.equal(f.coach.parentNode,f.practice);assert.equal(f.coach.nextSibling,f.afterCoach);
 f.flushClose();f.shortcut.click();assert.equal(f.panel.open,false);assert.equal(f.library.parentNode,f.layout);
 f.resize(true);f.setLanguage('zh');f.shortcut.click();
 assert.equal(f.panel.open,true);assert.equal(f.panelTitle.textContent,'zh:lessons');assert.equal(f.library.parentNode,f.panelBody);
 f.resize(true);assert.equal(f.panel.open,true,'unchanged mobile media state must not close the panel');
});

test('existing lesson selection handlers can return to the board and retain every library control',t=>{
 const f=fixture(t);const selected=[];
 const selectLesson=event=>{const button=event.target.closest('[data-lesson]');if(button){selected.push(button.dataset.lesson);f.ui.closePanel();f.ui.returnToBoard({heading:true});}};
 f.exerciseList.onclick=selectLesson;f.buttons.lessons.click();f.lessonLabel.click();f.flushClose();
 assert.deepEqual(selected,['opposition']);assert.equal(f.exerciseList.onclick,selectLesson);assert.equal(f.panel.open,false);assert.equal(f.library.parentNode,f.layout);assert.equal(f.document.activeElement,f.title);assert.equal(f.scrolls.at(-1).node,f.title);
 assert.equal(f.search.value,'pawn');assert.equal(f.filter.value,'Pawn fundamentals');
 f.buttons.lessons.click();f.lessonLabel.click();f.flushClose();assert.deepEqual(selected,['opposition','opposition']);
});

test('progress and settings use their existing dialogs and return navigation state to Board on close',t=>{
 const f=fixture(t);f.buttons.progress.click();assert.equal(f.progressShows(),1);assert.equal(f.progress.open,true);assert.equal(f.buttons.progress.getAttribute('aria-current'),'page');
 f.progress.close();f.flushClose();assert.equal(f.buttons.board.getAttribute('aria-current'),'page');
 f.buttons.settings.click();assert.equal(f.settings.open,true);assert.equal(f.buttons.settings.getAttribute('aria-current'),'page');
 f.settings.close();f.flushClose();assert.equal(f.buttons.board.getAttribute('aria-current'),'page');assert.equal(f.library.parentNode,f.layout);assert.equal(f.coach.parentNode,f.practice);
});
