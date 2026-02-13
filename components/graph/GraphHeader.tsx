import { cn } from "@/lib/utils";

interface GraphHeaderProps {
  title: string;
  mainTab: string;
  // Se añade "estadisticas" al tipo permitido
  setMainTab: (tab: "grafo" | "intervenciones" | "editar" | "estadisticas") => void;
  graphView: string;
  setGraphView: (view: "polaridad" | "estructural") => void;
  editTab: string;
  setEditTab: (tab: "conceptos" | "relaciones") => void;
  rondaActual: number;
  maxRondas: number;
  isPlaying: boolean;
}

export function GraphHeader({
  title, mainTab, setMainTab, graphView, setGraphView, editTab, setEditTab, rondaActual, maxRondas, isPlaying
}: GraphHeaderProps) {
  return (
    <header className="p-8 pb-4 flex flex-col items-center animate-fade-in relative">
      <div className="flex flex-col items-center w-full max-w-2xl">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none text-center mb-6">
          {title}
        </h1>

        <div className="flex gap-12 justify-center border-b border-white/5 w-full mb-4">
          <button 
            onClick={() => setMainTab("grafo")} 
            className={cn("pb-3 text-xs font-black uppercase tracking-[0.2em] transition-all", 
              mainTab === "grafo" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
            )}
          >
            Análisis de Ideas
          </button>
          
          <button 
            onClick={() => setMainTab("intervenciones")} 
            className={cn("pb-3 text-xs font-black uppercase tracking-[0.2em] transition-all",
              mainTab === "intervenciones" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
            )}
          >
            Registro de Intervenciones
          </button>

          {/* BOTÓN NUEVO: ESTADÍSTICAS */}
          <button 
            onClick={() => setMainTab("estadisticas")} 
            className={cn("pb-3 text-xs font-black uppercase tracking-[0.2em] transition-all",
              mainTab === "estadisticas" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
            )}
          >
            Estadísticas
          </button>

          <button 
            onClick={() => setMainTab("editar")} 
            className={cn("pb-3 text-xs font-black uppercase tracking-[0.2em] transition-all",
              mainTab === "editar" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
            )}
          >
            Editar
          </button>
        </div>

        {/* SUB-PESTAÑAS: Aparecen en Editar y en Estadísticas */}
        {(mainTab === "editar" || mainTab === "estadisticas") && (
          <div className="flex gap-8 justify-center mb-2">
            <button 
              onClick={() => setEditTab("conceptos")}
              className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                editTab === "conceptos" ? "text-white" : "text-gray-600"
              )}
            >
              Conceptos
            </button>
            <button 
              onClick={() => setEditTab("relaciones")}
              className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                editTab === "relaciones" ? "text-white" : "text-gray-600"
              )}
            >
              Relaciones
            </button>
          </div>
        )}

        {mainTab === "grafo" && (
          <div className="flex gap-4 bg-black/40 p-1 rounded-full border border-white/10 mb-2">
            <button 
              onClick={() => setGraphView("estructural")}
              className={cn("px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                graphView === "estructural" ? "bg-[#1e90ff] text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              Grafo de Lógica
            </button>
            <button 
              onClick={() => setGraphView("polaridad")}
              className={cn("px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                graphView === "polaridad" ? "bg-[#1e90ff] text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              Consenso y Disenso
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-500 font-medium tracking-wide uppercase text-[10px] mt-4">
        Secuencia Temporal: <span className="text-[#1e90ff]">{rondaActual} / {maxRondas}</span>
        {isPlaying && <span className="ml-4 text-orange-500 animate-pulse">● PLAYBACK ACTIVO</span>}
      </p>
    </header>
  );
}