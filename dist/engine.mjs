// Stockfish runs in its own worker so thinking never blocks the board.
export class Engine {
  constructor(){ this.queue=Promise.resolve(); this.worker=null; this.ready=null; }
  init(){
    if(this.ready) return this.ready;
    this.ready=new Promise((resolve,reject)=>{
      const worker=this.worker=new Worker(new URL('./vendor/stockfish-17.1-lite-single-03e3232.js',import.meta.url));
      const timeout=setTimeout(()=>fail(new Error('The chess engine did not load. Please try again.')),20000);
      const fail=(error)=>{clearTimeout(timeout);worker.terminate();this.ready=null;this.worker=null;reject(error);};
      worker.onerror=()=>fail(new Error('The chess engine could not load. Please try again.'));
      worker.onmessage=({data})=>{if(data==='uciok'){worker.postMessage('setoption name Hash value 16');worker.postMessage('isready');}if(data==='readyok'){clearTimeout(timeout);worker.onmessage=null;resolve();}};
      worker.postMessage('uci');
    });
    return this.ready;
  }
  analyze(fen,milliseconds=450){
    const task=this.queue.catch(()=>{}).then(async()=>{
      await this.init();
      return new Promise((resolve,reject)=>{
        const worker=this.worker;
        let evaluation=null;
        const timeout=setTimeout(()=>{worker.terminate();this.ready=null;this.worker=null;reject(new Error('The engine took too long. Please try again.'));},15000);
        worker.onerror=()=>{clearTimeout(timeout);worker.terminate();this.ready=null;this.worker=null;reject(new Error('The engine stopped. Please try again.'));};
        worker.onmessage=({data})=>{
          if(typeof data!=='string')return;
          const score=data.match(/score (cp|mate) (-?\d+)/);
          if(score)evaluation={type:score[1],value:Number(score[2])};
          if(data.startsWith('bestmove ')){clearTimeout(timeout);worker.onmessage=null;resolve({move:data.split(' ')[1],evaluation});}
        };
        worker.postMessage('position fen '+fen);
        worker.postMessage('go movetime '+milliseconds);
      });
    });
    this.queue=task;return task;
  }
}
