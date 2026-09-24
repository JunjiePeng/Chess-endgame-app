import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForReply} from '../dist/reply-pacing.mjs';

function timeAt(initial){
 let time=initial;
 const waits=[];
 return {now:()=>time,wait:async milliseconds=>{waits.push(milliseconds);time+=milliseconds;},advance:milliseconds=>time+=milliseconds,waits};
}

test('a fast engine leaves a normal move visible for 950 ms in total',async()=>{
 const time=timeAt(350);
 assert.equal(await waitForReply({renderedAt:0,now:time.now,wait:time.wait}),true);
 assert.deepEqual(time.waits,[600]);assert.equal(time.now(),950);
});

test('a capture or recapture leaves the rendered move visible for 1200 ms',async()=>{
 const time=timeAt(350);
 assert.equal(await waitForReply({renderedAt:0,capture:true,now:time.now,wait:time.wait}),true);
 assert.deepEqual(time.waits,[850]);assert.equal(time.now(),1200);
});

test('analysis time counts from the rendered move instead of adding a full second afterward',async()=>{
 const time=timeAt(830);
 await waitForReply({renderedAt:100,now:time.now,wait:time.wait});
 assert.deepEqual(time.waits,[220]);assert.equal(time.now(),1050);
});

test('a slow normal reply does not receive an additional pause',async()=>{
 const time=timeAt(1400);
 assert.equal(await waitForReply({renderedAt:0,now:time.now,wait:time.wait}),true);
 assert.deepEqual(time.waits,[]);assert.equal(time.now(),1400);
});

test('captures keep their longer minimum after the normal minimum has elapsed',async()=>{
 const time=timeAt(1050);
 await waitForReply({renderedAt:0,capture:true,now:time.now,wait:time.wait});
 assert.deepEqual(time.waits,[150]);assert.equal(time.now(),1200);
});

test('a capture reply that already took 1200 ms is ready immediately',async()=>{
 const time=timeAt(1200);
 assert.equal(await waitForReply({renderedAt:0,capture:true,now:time.now,wait:time.wait}),true);
 assert.deepEqual(time.waits,[]);
});

test('a position superseded while the engine was thinking does not wait or apply',async()=>{
 const time=timeAt(350);
 assert.equal(await waitForReply({renderedAt:0,isCurrent:()=>false,now:time.now,wait:time.wait}),false);
 assert.deepEqual(time.waits,[]);
});

test('reset or undo during the remaining pause cancels the reply',async()=>{
 const time=timeAt(350);let current=true;
 const ready=await waitForReply({renderedAt:0,isCurrent:()=>current,now:time.now,wait:async milliseconds=>{await time.wait(milliseconds);current=false;}});
 assert.equal(ready,false);assert.deepEqual(time.waits,[600]);
});

test('a stale reply is rejected even when its display budget already elapsed',async()=>{
 const time=timeAt(2000);
 assert.equal(await waitForReply({renderedAt:0,isCurrent:()=>false,now:time.now,wait:time.wait}),false);
 assert.deepEqual(time.waits,[]);
});

test('an early timer is followed by only the remaining display time',async()=>{
 const time=timeAt(350),waits=[];
 await waitForReply({renderedAt:0,now:time.now,wait:async milliseconds=>{waits.push(milliseconds);time.advance(waits.length===1?100:milliseconds);}});
 assert.deepEqual(waits,[600,500]);assert.equal(time.now(),950);
});

test('without an earlier rendered timestamp the current clock starts the pause',async()=>{
 const time=timeAt(5000);
 assert.equal(await waitForReply({now:time.now,wait:time.wait}),true);
 assert.deepEqual(time.waits,[950]);assert.equal(time.now(),5950);
});
