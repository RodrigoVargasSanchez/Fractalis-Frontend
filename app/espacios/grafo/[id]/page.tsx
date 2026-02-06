"use client";

import { use, useState, useRef, useEffect } from "react";
import ReactFlow, { 
  Background, 
  Controls, 
  ReactFlowProvider, 
  Panel, 
  useReactFlow, 
  BackgroundVariant 
} from "reactflow";
import "reactflow/dist/style.css";

import { useGraphLogic } from "./hooks/useGraphLogic";
import { CircleNode } from "@/components/graph/CircleNode";
import { Participants } from "@/components/graph/Participants";
import { GraphControls } from "@/components/graph/GraphControls";
import { IntervencionesTable } from "@/components/graph/IntervencionesTable";
import { RelationLegend } from "@/components/graph/RelationLegend";

const nodeTypes = { circle: CircleNode };

function GrafoContent({ resolvedParams }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Nivel 1: Tipo de vista principal
  const [mainTab, setMainTab] = useState<"grafo" | "intervenciones">("grafo");
  
  // Nivel 2: Sub-tipo de grafo (solo visible si mainTab === 'grafo')
  const [graphView, setGraphView] = useState<"polaridad" | "estructural">("estructural");
  
  const logic = useGraphLogic(resolvedParams.id);
  const { fitView } = useReactFlow();

  // Sincroniza la sub-pestaña con el filtro del hook
  useEffect(() => {
    if (mainTab === "grafo") {
      logic.setRelationFilter(graphView === "polaridad" ? "polaridad" : "otros");
    }
  }, [graphView, mainTab, logic]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        fitView({ duration: 600, padding: 0.2 });
      }, 750); 
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [fitView]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex-1 bg-[#222222] relative flex flex-col min-h-screen font-sans text-white">
      {!isFullscreen && (
        <header className="p-8 pb-4 flex flex-col items-center animate-fade-in relative">
          <div className="flex flex-col items-center w-full max-w-2xl">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none text-center mb-6">
              {logic.graphTitle}
            </h1>

            {/* NIVEL 1: NAVEGACIÓN PRINCIPAL */}
            <div className="flex gap-12 justify-center border-b border-white/5 w-full mb-4">
              <button 
                onClick={() => setMainTab("grafo")} 
                className={`pb-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  mainTab === "grafo" ? "text-white border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
                }`}
              >
                Análisis de Ideas
              </button>
              <button 
                onClick={() => setMainTab("intervenciones")} 
                className={`pb-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  mainTab === "intervenciones" ? "text-white border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
                }`}
              >
                Registro de Intervenciones
              </button>
            </div>

            {/* NIVEL 2: SELECTOR DE TIPO DE GRAFO (Solo si está en 'grafo') */}
            {mainTab === "grafo" && (
              <div className="flex gap-4 bg-black/40 p-1 rounded-full border border-white/10 mb-2">
                <button 
                  onClick={() => setGraphView("estructural")}
                  className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    graphView === "estructural" ? "bg-[#1e90ff] text-white shadow-lg" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Grafo de Lógica
                </button>
                <button 
                  onClick={() => setGraphView("polaridad")}
                  className={`px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    graphView === "polaridad" ? "bg-[#1e90ff] text-white shadow-lg" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Consenso y Disenso
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-500 font-medium tracking-wide uppercase text-[10px] mt-4">
            Secuencia Temporal: <span className="text-[#1e90ff]">{logic.rondaActual} / {logic.maxRondas}</span>
            {logic.isPlaying && <span className="ml-4 text-orange-500 animate-pulse">● PLAYBACK ACTIVO</span>}
          </p>
        </header>
      )}

      <div className="flex-1 relative">
        {mainTab === "grafo" ? (
          <div 
            ref={containerRef} 
            className={`relative overflow-hidden transition-all duration-700 bg-[#0d0d0d] ${
              isFullscreen 
                ? 'w-screen h-screen m-0 rounded-none border-none' 
                : 'mx-8 my-4 rounded-[40px] border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] h-[70vh]'
            }`}
          >
            <ReactFlow 
              nodes={logic.nodes} 
              edges={logic.edges} 
              nodeTypes={nodeTypes} 
              onNodesChange={logic.onNodesChange} 
              onEdgesChange={logic.onEdgesChange} 
              minZoom={0.05} 
              maxZoom={4}
            >
              <Panel position="top-left">
                <Participants personColors={logic.masterData.personColors} />
              </Panel>

              <Panel position="top-right">
                <RelationLegend filter={logic.relationFilter} />
              </Panel>
              
              <Panel position="bottom-center">
                <GraphControls 
                  {...logic} 
                  onFullscreen={toggleFullscreen} 
                  totalNodes={logic.masterData.nodes.length} 
                />
              </Panel>
              <Controls className="!bg-[#1a1a1a] !border-white/10 !fill-white shadow-2xl rounded-lg overflow-hidden" />
            </ReactFlow>
          </div>
        ) : (
          <IntervencionesTable movieSequence={logic.movieSequence} />
        )}
      </div>

      <style jsx global>{`
        .perfect-circle { 
          width: 140px; height: 140px; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
          color: white; font-size: 10px; font-weight: 800; text-align: center; border: 2px solid rgba(255,255,255,0.2); 
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }
        .perfect-circle.is-focused { animation: pulse-border 1.5s infinite alternate; }
        @keyframes pulse-border { from { border-color: white; } to { border-color: rgba(255,255,255,0.5); } }
        .growing-edge path { stroke-dasharray: 5000; stroke-dashoffset: 5000; animation: drawEdge 5s ease-in-out forwards; }
        .edge-static path { stroke-dasharray: none !important; stroke-dashoffset: 0 !important; animation: none !important; opacity: 0.8 !important; }
        @keyframes drawEdge { to { stroke-dashoffset: 0; } }
        @keyframes fadeInScale { 0% { opacity: 0; transform: scale(0.3); filter: blur(10px); } 100% { opacity: 1; transform: scale(1); filter: blur(0px); } }
        .anim-fade-in { animation: fadeInScale 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .react-flow__controls-button { background: #1a1a1a !important; border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; fill: #ffffff !important; }
        .react-flow__controls-button:hover { background: #333333 !important; }
        input[type="range"] { -webkit-appearance: none; background: transparent; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #1e90ff; cursor: pointer; border: 3px solid white; box-shadow: 0 0 10px rgba(30,144,255,0.4); }
      `}</style>
    </div>
  );
}

export default function GrafoEvolutivoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ReactFlowProvider>
      <GrafoContent resolvedParams={resolvedParams} />
    </ReactFlowProvider>
  );
}