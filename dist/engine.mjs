// Stockfish runs in its own worker so thinking never blocks the board.
export class Engine {
  constructor(){ this.queue=Promise.resolve(); this.worker=null; this.ready=null; }
  init(){
    if(this.ready) return this.ready;
    const initialization=new Promise((resolve,reject)=>{
      let worker=null,timeout;
      const fail=(error)=>{
        clearTimeout(timeout);
        if(worker){worker.onmessage=null;worker.onerror=null;worker.terminate();}
        if(this.worker===worker){this.ready=null;this.worker=null;}
        reject(error);
      };
      try{
        worker=this.worker=new Worker(new URL('./vendor/stockfish-17.1-lite-single-03e3232.js',import.meta.url));
        timeout=setTimeout(()=>fail(new Error('The chess engine did not load. Please try again.')),20000);
        worker.onerror=()=>fail(new Error('The chess engine could not load. Please try again.'));
        worker.onmessage=({data})=>{
          try{
            if(data==='uciok'){worker.postMessage('setoption name Hash value 16');worker.postMessage('isready');}
            if(data==='readyok'){clearTimeout(timeout);worker.onmessage=null;resolve();}
          }catch(error){fail(error);}
        };
        worker.postMessage('uci');
      }catch(error){fail(error);}
    });
    this.ready=initialization;
    // Synchronous construction failures happen before this.ready is assigned.
    initialization.catch(()=>{if(this.ready===initialization)this.ready=null;});
    return initialization;
  }
  // Superseded queued requests resolve null without starting a search.
  analyze(fen,milliseconds=450,skill=20,isCurrent=()=>true){
    const task=this.queue.catch(()=>{}).then(async()=>{
      if(!isCurrent())return null;
      await this.init();
      if(!isCurrent())return null;
      return new Promise((resolve,reject)=>{
        const worker=this.worker;
        let evaluation=null,depth=null;
        const fail=error=>{clearTimeout(timeout);worker.onmessage=null;worker.onerror=null;worker.terminate();if(this.worker===worker){this.ready=null;this.worker=null;}reject(error);};
        const timeout=setTimeout(()=>fail(new Error('The engine took too long. Please try again.')),15000);
        worker.onerror=()=>fail(new Error('The engine stopped. Please try again.'));
        worker.onmessage=({data})=>{
          if(typeof data!=='string')return;
          const score=data.match(/score (cp|mate) (-?\d+)/);
          // Bounds and alternate principal variations cannot confirm a result.
          // Keep the depth paired with the same exact root score.
          const pv=data.match(/\bmultipv (\d+)/),searchDepth=data.match(/\bdepth (\d+)/);
          if(score&&(!pv||pv[1]==='1')){
            if(/\b(?:upperbound|lowerbound)\b/.test(data)){evaluation=null;depth=null;}
            else{evaluation={type:score[1],value:Number(score[2])};depth=searchDepth?Number(searchDepth[1]):null;}
          }
          if(data.startsWith('bestmove ')){clearTimeout(timeout);worker.onmessage=null;resolve({move:data.split(' ')[1],evaluation,...(depth!==null?{depth}:{})});}
        };
        try{
          worker.postMessage('setoption name Skill Level value '+Math.max(0,Math.min(20,Math.round(skill))));
          worker.postMessage('position fen '+fen);
          worker.postMessage('go movetime '+milliseconds);
        }catch(error){fail(error);}
      });
    });
    this.queue=task;return task;
  }
}
