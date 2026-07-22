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
import { grafoService } from "@/services/grafoService";

// Componentes modulares
import { GraphHeader } from "@/components/graph/GraphHeader";
import { EditPanelView } from "@/components/graph/EditPanelView";
import { StatsPanelView } from "@/components/graph/StatsPanelView";

// Otros componentes
import { CircleNode } from "@/components/graph/CircleNode";
import { GraphSkeleton } from "@/components/graph/GraphSkeleton";
import { Participants } from "@/components/graph/Participants";
import { GraphControls } from "@/components/graph/GraphControls";
import { IntervencionesTable } from "@/components/graph/IntervencionesTable";
import { RelationLegend } from "@/components/graph/RelationLegend";
import { InteractiveEdge } from "@/components/graph/InteractiveEdge";
import { CanvasControls } from "@/components/graph/CanvasControls";
import { cn } from "@/lib/utils";

const nodeTypes = { circle: CircleNode };
const edgeTypes = { interactive: InteractiveEdge, };

function GrafoContent({ resolvedParams }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mainTab, setMainTab] = useState<"grafo" | "intervenciones" | "editar" | "estadisticas">("grafo");
  const [graphView, setGraphView] = useState<"polaridad" | "estructural">("estructural");
  const [editTab, setEditTab] = useState<"conceptos" | "relaciones">("conceptos");

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleOpenAnalysis = async () => {
    setIsAnalysisOpen(true);
    if (analysisText) return;

    setIsAnalyzing(true);
    try {
      const concepts = logic.nodes.map((n: any) => n.data?.label || n.id);
      const relations = logic.edges.map((e: any) => ({
        source: e.source,
        sourceLabel: logic.nodes.find((n: any) => n.id === e.source)?.data?.label || e.source,
        target: e.target,
        targetLabel: logic.nodes.find((n: any) => n.id === e.target)?.data?.label || e.target,
        type: e.label || e.type || "relación",
      }));

      const interventions = logic.movieSequence.map((item: any) => ({
        ronda: item.ronda,
        authorName: item.authorName || "Participante",
        opinionContent: item.opinionContent || "",
        conceptName: item.name || "",
      }));

      const res = await grafoService.getNarrativeAnalysis(resolvedParams.id, {
        titulo: logic.graphTitle,
        descripcion: "",
        concepts,
        relations,
        interventions
      });

      setAnalysisText(res.analysis || "No se pudo generar el informe.");
    } catch (err: any) {
      console.error(err);
      setAnalysisText(`Error al consultar con el servicio de análisis: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const logic = useGraphLogic(resolvedParams.id);
  const { fitView } = useReactFlow();

  // Efecto para actualizar el título del navegador con el título del grafo
  useEffect(() => {
    if (logic.graphTitle) {
      document.title = `${logic.graphTitle} - Grafo - Fractalis`;
    }
  }, [logic.graphTitle]);

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
    if (mainTab === "grafo" || mainTab === "estadisticas") {
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
    <div className="h-screen bg-[#222222] relative flex flex-col font-sans text-white overflow-hidden">
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

      <div className="flex-grow flex-1 relative flex flex-col min-h-0">
        {mainTab === "grafo" ? (
          <div
            ref={containerRef}
            className={cn("relative overflow-hidden transition-all duration-700 bg-[#0d0d0d] flex-grow flex-1 min-h-0",
              isFullscreen
                ? 'w-screen h-screen m-0 rounded-none border-none'
                : 'mx-8 mb-6 rounded-[40px] border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)]'
            )}
          >
            <ReactFlow
              nodes={logic.nodes}
              edges={logic.edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
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
              <Panel position="bottom-center" className="flex flex-col items-center gap-2 z-40">
                <GraphControls
                  {...logic}
                  onFullscreen={toggleFullscreen}
                  totalNodes={logic.masterData.nodes.length}
                />
                <CanvasControls
                  nodes={logic.nodes}
                  selectedNodeId={logic.selectedNodeId}
                  setSelectedNodeId={logic.setSelectedNodeId}
                  relationTypeFilter={logic.relationTypeFilter}
                  setRelationTypeFilter={logic.setRelationTypeFilter}
                  selectedPerson={logic.selectedPerson}
                  setSelectedPerson={logic.setSelectedPerson}
                  personColors={logic.masterData.personColors}
                  isPlaying={logic.isPlaying}
                />
              </Panel>
              <Panel position="bottom-left" className="m-4">
                <button
                  onClick={handleOpenAnalysis}
                  disabled={logic.isCommunityLayoutOn}
                  className={cn(
                    "px-5 py-2.5 bg-[#111]/90 backdrop-blur-2xl text-gray-400 hover:text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(236,72,153,0.35)] border border-white/10 hover:border-pink-500/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer",
                    logic.isCommunityLayoutOn && "opacity-30 pointer-events-none"
                  )}
                >
                  <svg className="w-3.5 h-3.5 text-pink-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Ver análisis
                </button>
              </Panel>
            </ReactFlow>
          </div>
        ) : mainTab === "intervenciones" ? (
          <IntervencionesTable movieSequence={logic.movieSequence} />
        ) : mainTab === "estadisticas" ? (
          <StatsPanelView
            activeTab={editTab}
            nodes={logic.nodes}
            edges={logic.edges}
            relationNodes={logic.masterData.nodes}
            relationEdges={tempEdges}
            totalObservations={logic.maxRondas}
            isCommunityLayoutOn={logic.isCommunityLayoutOn}
            setIsCommunityLayoutOn={logic.setIsCommunityLayoutOn}
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

      {/* MODAL DE ANÁLISIS DE INTELIGENCIA ARTIFICIAL */}
      {isAnalysisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl h-full bg-[#090909] border-l border-white/10 p-8 shadow-2xl flex flex-col justify-between animate-slide-in-right">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-white">Análisis de Diálogo IA</h2>
              </div>
              <button
                onClick={() => setIsAnalysisOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              {isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 py-20">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs font-mono uppercase tracking-wider text-white">Consultando a OpenAI...</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">// Reconstruyendo red discursiva</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert prose-xs text-gray-300 font-sans max-w-none space-y-4">
                  {analysisText.split("\n").map((line, idx) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("###")) {
                      return (
                        <h4 key={idx} className="text-xs font-mono uppercase tracking-wider text-pink-400 mt-6 mb-2 border-b border-pink-500/10 pb-1">
                          {trimmed.replace("###", "").trim()}
                        </h4>
                      );
                    }
                    if (trimmed.startsWith("##")) {
                      return (
                        <h3 key={idx} className="text-sm font-mono uppercase tracking-wider text-white mt-8 mb-3">
                          {trimmed.replace("##", "").trim()}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith("#")) {
                      return (
                        <h2 key={idx} className="text-base font-black tracking-tight uppercase italic text-white mt-10 mb-4 bg-gradient-to-r from-pink-500/20 to-transparent p-2 rounded-l border-l-4 border-pink-500">
                          {trimmed.replace("#", "").trim()}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                      return (
                        <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-gray-300 mb-1">
                          {trimmed.slice(1).trim()}
                        </li>
                      );
                    }
                    if (trimmed) {
                      return (
                        <p key={idx} className="text-xs leading-relaxed text-gray-400 mb-3">
                          {trimmed}
                        </p>
                      );
                    }
                    return <div key={idx} className="h-2" />;
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mt-6 flex justify-end">
              <button
                onClick={() => setIsAnalysisOpen(false)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10 transition-colors"
              >
                Cerrar Informe
              </button>
            </div>
          </div>
        </div>
      )}

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
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideInRight { 0% { transform: translateX(100%); } 100% { transform: translateX(0); } }
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