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

// Definición de tipos de nodo personalizados para el grafo
const nodeTypes = { circle: CircleNode };

/**
 * Componente interno que consume el contexto de ReactFlowProvider.
 * Contiene la lógica de renderizado del grafo, tablas de intervenciones y controles de pantalla completa.
 */
function GrafoContent({ resolvedParams }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"grafo" | "intervenciones">("grafo");
  
  // Hook personalizado que centraliza la lógica de nodos, aristas y reproducción temporal
  const logic = useGraphLogic(resolvedParams.id);
  
  // Hook de ReactFlow para manipular la cámara del grafo
  const { fitView } = useReactFlow();

  /**
   * Efecto para monitorizar cambios en el estado de pantalla completa del navegador.
   * Ajusta la vista del grafo automáticamente tras el cambio de dimensiones.
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Timeout para esperar a que el DOM se asiente tras la transición de pantalla completa
      setTimeout(() => {
        fitView({ duration: 600, padding: 0.2 });
      }, 750); 
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [fitView]);

  /**
   * Alterna el modo de pantalla completa utilizando el API nativo del navegador.
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error al intentar entrar en pantalla completa: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex-1 bg-[#222222] relative flex flex-col min-h-screen font-sans text-white">
      {/* Cabecera: Se oculta dinámicamente en modo pantalla completa para maximizar el área visual */}
      {!isFullscreen && (
        <header className="p-8 pb-4 flex flex-col items-center animate-fade-in relative">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none text-center">
              {logic.graphTitle}
            </h1>
            {/* Navegación por pestañas entre la visualización del grafo y la tabla de datos */}
            <div className="flex gap-8 mt-6 justify-center">
              <button 
                onClick={() => setActiveTab("grafo")} 
                className={`pb-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === "grafo" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
                }`}
              >
                Grafo Evolutivo
              </button>
              <button 
                onClick={() => setActiveTab("intervenciones")} 
                className={`pb-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === "intervenciones" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
                }`}
              >
                Intervenciones
              </button>
            </div>
          </div>
          
          {/* Información de progreso: Ronda actual e indicador de reproducción automática */}
          <p className="text-gray-500 font-medium tracking-wide uppercase text-sm mt-4">
            Ronda: <span className="text-[#1e90ff]">{logic.rondaActual}</span>
            {logic.isPlaying && <span className="ml-4 text-orange-500 animate-pulse">● MODO CINE</span>}
          </p>
        </header>
      )}

      {/* Contenedor Principal de Visualización */}
      <div className="flex-1 relative">
        {activeTab === "grafo" ? (
          <div 
            ref={containerRef} 
            className={`relative overflow-hidden transition-all duration-700 bg-[#0d0d0d] ${
              isFullscreen 
                ? 'w-screen h-screen m-0 rounded-none border-none' 
                : 'mx-8 my-4 rounded-[40px] border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] h-[75vh]'
            }`}
          >
            {/* Instancia de ReactFlow para renderizar el grafo interactivo */}
            <ReactFlow 
              nodes={logic.nodes} 
              edges={logic.edges} 
              nodeTypes={nodeTypes} 
              onNodesChange={logic.onNodesChange} 
              onEdgesChange={logic.onEdgesChange} 
              minZoom={0.05} 
              maxZoom={4}
            >
              {/* Panel superior con la leyenda de participantes y colores asociados */}
              <Panel position="top-left">
                <Participants personColors={logic.masterData.personColors} />
              </Panel>
              
              {/* Controles de reproducción, línea de tiempo y pantalla completa */}
              <Panel position="bottom-center">
                <GraphControls 
                  {...logic} 
                  onFullscreen={toggleFullscreen} 
                  totalNodes={logic.masterData.nodes.length} 
                />
              </Panel>

              {/* Controles nativos de zoom y navegación del grafo */}
              <Controls 
                className="!bg-[#1a1a1a] !border-white/10 !fill-white shadow-2xl rounded-lg overflow-hidden" 
              />
            </ReactFlow>
          </div>
        ) : (
          /* Vista alternativa: Tabla cronológica de intervenciones */
          <IntervencionesTable movieSequence={logic.movieSequence} />
        )}
      </div>

      {/* Inyección de estilos globales para animaciones de nodos y aristas SVG */}
      <style jsx global>{`
        .perfect-circle { 
          width: 140px; 
          height: 140px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
          font-size: 10px; 
          font-weight: 800; 
          text-align: center; 
          border: 2px solid rgba(255,255,255,0.2); 
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }
        .perfect-circle.is-focused { 
          animation: pulse-border 1.5s infinite alternate; 
        }
        @keyframes pulse-border { 
          from { border-color: white; } 
          to { border-color: rgba(255,255,255,0.5); } 
        }
        .growing-edge path { 
          stroke-dasharray: 5000; 
          stroke-dashoffset: 5000; 
          animation: drawEdge 5s ease-in-out forwards; 
        }
        .edge-static path { 
          stroke-dasharray: none !important; 
          stroke-dashoffset: 0 !important; 
          animation: none !important; 
          opacity: 0.8 !important; 
        }
        @keyframes drawEdge { to { stroke-dashoffset: 0; } }
        @keyframes fadeInScale { 
          0% { opacity: 0; transform: scale(0.3); filter: blur(10px); } 
          100% { opacity: 1; transform: scale(1); filter: blur(0px); } 
        }
        .anim-fade-in { animation: fadeInScale 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        .react-flow__controls-button {
          background: #1a1a1a !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          fill: #ffffff !important;
        }

        .react-flow__controls-button:hover {
          background: #333333 !important;
        }

        .react-flow__controls-button svg {
          max-width: 60%;
          max-height: 60%;
        }
        
        input[type="range"] { -webkit-appearance: none; background: transparent; }
        input[type="range"]::-webkit-slider-thumb { 
          -webkit-appearance: none; 
          height: 18px; 
          width: 18px; 
          border-radius: 50%; 
          background: #1e90ff; 
          cursor: pointer; 
          border: 3px solid white; 
          box-shadow: 0 0 10px rgba(30,144,255,0.4); 
        }
      `}</style>
    </div>
  );
}

/**
 * Punto de entrada de la página.
 * Envuelve el contenido en el ReactFlowProvider para permitir el acceso a los hooks internos de la librería.
 */
export default function GrafoEvolutivoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ReactFlowProvider>
      <GrafoContent resolvedParams={resolvedParams} />
    </ReactFlowProvider>
  );
}