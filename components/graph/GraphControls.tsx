interface GraphControlsProps {
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  velocidad: number;
  setVelocidad: (v: number) => void;
  rondaActual: number;
  setRondaActual: (v: number) => void;
  maxRondas: number;
  onFullscreen: () => void;
  nodoActualIdx: number;
  setNodoActualIdx: (v: number) => void;
  totalNodes: number;
}

export const GraphControls = ({ 
  isPlaying, setIsPlaying, velocidad, setVelocidad, 
  rondaActual, setRondaActual, maxRondas, onFullscreen,
  nodoActualIdx, setNodoActualIdx, totalNodes
}: GraphControlsProps) => {

  const handlePlayToggle = () => {
    if (!isPlaying && (nodoActualIdx >= totalNodes - 1 || nodoActualIdx === -1)) {
        setNodoActualIdx(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-[#111]/90 backdrop-blur-2xl p-4 px-8 rounded-[32px] border border-white/10 flex items-center gap-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] mb-6">
      <button onClick={handlePlayToggle} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.4)]' : 'bg-[#1e90ff] shadow-[0_0_25px_rgba(30,144,255,0.4)]'} hover:scale-110`}>
        {isPlaying ? <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
      </button>
      
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">Velocidad</span>
        <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/5 gap-1">
          {[{ label: '🐢', v: 6 }, { label: '🚶', v: 3 }, { label: '⚡', v: 1.5 }].map((v) => (
            <button key={v.v} onClick={() => setVelocidad(v.v)} className={`w-11 h-9 rounded-xl text-xl transition-all ${velocidad === v.v ? 'bg-white/20 scale-110' : 'opacity-30'}`}>{v.label}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-[320px] px-2 pt-2">
         <div className="relative h-6 flex items-center">
            <input
              type="range" min="0" max={maxRondas} value={rondaActual}
              onChange={(e) => { setRondaActual(parseInt(e.target.value)); setIsPlaying(false); setNodoActualIdx(-1); }}
              className="w-full h-2 accent-[#1e90ff] cursor-pointer z-10"
            />
            <div className="absolute w-full flex justify-between px-1">
              {Array.from({ length: maxRondas + 1 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= rondaActual ? 'bg-[#1e90ff] shadow-[0_0_8px_#1e90ff]' : 'bg-white/10'}`} />
              ))}
            </div>
         </div>
         <div className="flex justify-between w-full px-0.5 text-[11px] font-black tracking-tighter uppercase">
            {Array.from({ length: maxRondas + 1 }).map((_, i) => (
              <span key={i} className={i === rondaActual ? 'text-[#1e90ff]' : 'text-gray-600'}>R{i}</span>
            ))}
         </div>
      </div>

      <button onClick={onFullscreen} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:bg-white/10">
        <svg className="w-6 h-6 m-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 8V3h5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>
      </button>
    </div>
  );
};