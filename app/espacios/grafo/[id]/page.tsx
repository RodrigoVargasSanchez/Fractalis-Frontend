"use client";

import { use, useState, useRef, useEffect } from "react";
import ReactFlow, { 
  Controls, 
  ReactFlowProvider, 
  Panel, 
  useReactFlow 
} from "reactflow";
import "reactflow/dist/style.css";

// Hooks
import { useGraphLogic } from "./hooks/useGraphLogic";
import { useEditLogic } from "./hooks/useEditLogic"; 

// Componentes modulares
import { GraphHeader } from "@/components/graph/GraphHeader";
import { EditPanelView } from "@/components/graph/EditPanelView";
import { StatsPanelView } from "@/components/graph/StatsPanelView";

// Otros componentes
import { CircleNode } from "@/components/graph/CircleNode";
import { Participants } from "@/components/graph/Participants";
import { GraphControls } from "@/components/graph/GraphControls";
import { IntervencionesTable } from "@/components/graph/IntervencionesTable";
import { RelationLegend } from "@/components/graph/RelationLegend";
import { cn } from "@/lib/utils";

const nodeTypes = { circle: CircleNode };

function GrafoContent({ resolvedParams }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mainTab, setMainTab] = useState<"grafo" | "intervenciones" | "editar" | "estadisticas">("grafo");
  const [graphView, setGraphView] = useState<"polaridad" | "estructural">("estructural");
  const [editTab, setEditTab] = useState<"conceptos" | "relaciones">("conceptos");

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  
  const logic = useGraphLogic(resolvedParams.id);
  const { fitView } = useReactFlow();

  // INTEGRACIÓN DEL HOOK useEditLogic
  const {
    tempNodes, setTempNodes,
    tempEdges, setTempEdges,
    deletedEdgeIds, setDeletedEdgeIds,
    isSaving,
    handleSaveConcepts,
    handleSaveRelationships,
    handleCreateNewConcept
  } = useEditLogic(resolvedParams.id, logic.masterData, logic.refreshGraph);

  // Sincroniza la sub-pestaña con el filtro del hook de lógica de grafo
  useEffect(() => {
    if (mainTab === "grafo") {
      logic.setRelationFilter(graphView === "polaridad" ? "polaridad" : "otros");
    }
    if (mainTab === "intervenciones") {
      console.log("📑 [IntervencionesTable] Props enviadas:");
      console.log("movieSequence:", logic.movieSequence);
      console.log("Relaciones Maestras (Edges):", logic.masterData.edges);
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
      containerRef.current?.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (mainTab === "estadisticas") {
      console.log("📊 [StatsPanelView] Recibiendo datos maestros:");
      console.log("Nodos:", logic.masterData.nodes);
      console.log("Aristas:", logic.masterData.edges);
    }
    
    if (mainTab === "editar") {
      console.log("✏️ [EditPanelView] Recibiendo datos para edición:");
      console.log("Nodos Temporales (en edición):", tempNodes);
      console.log("Aristas Temporales (en edición):", tempEdges);
      console.log("Nodos Maestros (referencia):", logic.masterData.nodes);
    }
  }, [mainTab, tempNodes, tempEdges, logic.masterData]);

  return (
    <div className="flex-1 bg-[#222222] relative flex flex-col min-h-screen font-sans text-white">
      {/* Usamos isSaving del hook */}
      {isSaving && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center cursor-wait">
          <div className="w-12 h-12 border-4 border-[#1e90ff] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-black uppercase tracking-widest text-sm animate-pulse">Sincronizando Grafo...</p>
        </div>
      )}

      {!isFullscreen && (
        <GraphHeader 
          title={logic.graphTitle}
          mainTab={mainTab} setMainTab={setMainTab}
          graphView={graphView} setGraphView={setGraphView}
          editTab={editTab} setEditTab={setEditTab}
          rondaActual={logic.rondaActual}
          maxRondas={logic.maxRondas}
          isPlaying={logic.isPlaying}
        />
      )}

      <div className="flex-1 relative">
        {mainTab === "grafo" ? (
          <div 
            ref={containerRef} 
            className={cn("relative overflow-hidden transition-all duration-700 bg-[#0d0d0d]", 
              isFullscreen 
                ? 'w-screen h-screen m-0 rounded-none border-none' 
                : 'mx-8 my-4 rounded-[40px] border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] h-[70vh]'
            )}
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
        ) : mainTab === "intervenciones" ? (
          <IntervencionesTable movieSequence={logic.movieSequence} />
        ) : mainTab === "estadisticas" ? (
          <StatsPanelView 
            activeTab={editTab} // "conceptos" o "relaciones"
            nodes={logic.masterData.nodes} // Catálogo para buscar los nombres (labels)
            edges={tempEdges} // Recibe el mismo argumento que el EditPanelView
            totalObservations={logic.maxRondas} // Usado para normalizar frecuencia (N)
          />
        ) : (
          <EditPanelView
            pid={resolvedParams.id}
            editTab={editTab}
            tempNodes={tempNodes} 
            setTempNodes={setTempNodes}
            tempEdges={tempEdges} 
            setTempEdges={setTempEdges}
            deletedEdgeIds={deletedEdgeIds} 
            setDeletedEdgeIds={setDeletedEdgeIds}
            masterNodes={logic.masterData.nodes}
            movieSequence={logic.movieSequence} 
            handleCreateNewConcept={handleCreateNewConcept} 
            onSaveConcepts={() => handleSaveConcepts(() => setMainTab("grafo"))}
            onSaveRelationships={() => handleSaveRelationships(() => setMainTab("grafo"))}
            onCancel={() => setMainTab("grafo")}
            onRefresh={logic.refreshGraph}
          />
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1e90ff; }
        .perfect-circle { width: 140px; height: 140px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 800; text-align: center; border: 2px solid rgba(255,255,255,0.2); transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .growing-edge path { stroke-dasharray: 5000; stroke-dashoffset: 5000; animation: drawEdge 5s ease-in-out forwards; }
        .edge-static path { stroke-dasharray: none !important; stroke-dashoffset: 0 !important; animation: none !important; opacity: 0.8 !important; }
        @keyframes drawEdge { to { stroke-dashoffset: 0; } }
        .anim-fade-in { animation: fadeInScale 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes fadeInScale { 0% { opacity: 0; transform: scale(0.3); filter: blur(10px); } 100% { opacity: 1; transform: scale(1); filter: blur(0px); } }
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