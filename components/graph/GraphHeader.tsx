import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";

interface GraphHeaderProps {
  title: string;
  mainTab: string;
  setMainTab: (tab: "grafo" | "intervenciones" | "editar" | "estadisticas") => void;
  graphView: string;
  setGraphView: (view: "polaridad" | "estructural") => void;
  editTab: string;
  setEditTab: (tab: "conceptos" | "relaciones") => void;
  rondaActual: number;
  maxRondas: number;
  isPlaying: boolean;
  isCommunityLayoutOn?: boolean;
}

export function GraphHeader({
  title, mainTab, setMainTab, graphView, setGraphView, editTab, setEditTab, rondaActual, maxRondas, isPlaying, isCommunityLayoutOn
}: GraphHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? authService.getSessionUser() : null;
  const isAdmin = user?.rol === "admin";

  return (
    <header className="pt-4 pb-2 px-8 flex flex-col items-center animate-fade-in relative flex-shrink-0">
      <div className="flex flex-col items-center w-full max-w-2xl">
        <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic text-white leading-none text-center mb-3">
          {title}
        </h1>

        <div className={cn("flex gap-8 justify-center border-b border-white/5 w-full mb-2 transition-all", isCommunityLayoutOn && "opacity-30 pointer-events-none")}>
          <button
            onClick={() => setMainTab("grafo")}
            className={cn("pb-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              mainTab === "grafo" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
            )}
          >
            Análisis de Ideas
          </button>

          <button
            onClick={() => setMainTab("intervenciones")}
            className={cn("pb-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              mainTab === "intervenciones" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
            )}
          >
            Registro de Intervenciones
          </button>

          <button
            onClick={() => setMainTab("estadisticas")}
            className={cn("pb-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              mainTab === "estadisticas" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
            )}
          >
            Estadísticas
          </button>

          {isAdmin && (
            <button
              onClick={() => setMainTab("editar")}
              className={cn("pb-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                mainTab === "editar" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
              )}
            >
              Editar
            </button>
          )}
        </div>

        {(mainTab === "editar" || mainTab === "estadisticas") && (
          <div className="flex gap-8 justify-center mb-1">
            <button
              onClick={() => setEditTab("conceptos")}
              className={cn("text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                editTab === "conceptos" ? "text-white" : "text-gray-600"
              )}
            >
              Conceptos
            </button>
            <button
              onClick={() => setEditTab("relaciones")}
              className={cn("text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                editTab === "relaciones" ? "text-white" : "text-gray-600"
              )}
            >
              Relaciones
            </button>
          </div>
        )}

        {(mainTab === "grafo" || (mainTab === "estadisticas" && editTab === "conceptos")) && (
          <div className={cn("flex gap-4 bg-black/40 p-0.5 rounded-full border border-white/10 mb-1 animate-fade-in", isCommunityLayoutOn && "opacity-30 pointer-events-none")}>
            <button
              onClick={() => setGraphView("estructural")}
              className={cn("px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all",
                graphView === "estructural" ? "bg-[#1e90ff] text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              Grafo de Lógica
            </button>
            <button
              onClick={() => setGraphView("polaridad")}
              className={cn("px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all",
                graphView === "polaridad" ? "bg-[#1e90ff] text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              Consenso y Disenso
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-500 font-medium tracking-wide uppercase text-[9px] mt-1">
        Secuencia Temporal: <span className="text-[#1e90ff]">{rondaActual} / {maxRondas}</span>
        {isPlaying && <span className="ml-4 text-orange-500 animate-pulse">● PLAYBACK ACTIVO</span>}
        {isCommunityLayoutOn && <span className="ml-4 text-[#a855f7] animate-pulse">● MODO COMUNIDAD ACTIVO</span>}
      </p>
    </header>
  );
}