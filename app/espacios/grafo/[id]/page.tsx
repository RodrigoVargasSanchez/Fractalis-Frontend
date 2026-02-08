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
import { grafoService } from "@/services/grafoService";
import { RELATIONS_CONFIG } from "@/app/nuevo/subir-archivo/constants";
import { cn } from "@/lib/utils";

const nodeTypes = { circle: CircleNode };

function GrafoContent({ resolvedParams }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Nivel 1: Tipo de vista principal
  const [mainTab, setMainTab] = useState<"grafo" | "intervenciones" | "editar">("grafo");
  
  // Nivel 2: Sub-tipo de grafo (solo visible si mainTab === 'grafo')
  const [graphView, setGraphView] = useState<"polaridad" | "estructural">("estructural");

  // Nivel 2: Sub-tipo de edición (solo visible si mainTab === 'editar')
  const [editTab, setEditTab] = useState<"conceptos" | "relaciones">("conceptos");
  
  const logic = useGraphLogic(resolvedParams.id);
  const { fitView } = useReactFlow();

  // Estados temporales para edición
  const [tempNodes, setTempNodes] = useState<any[]>([]);
  const [tempEdges, setTempEdges] = useState<any[]>([]);
  const [deletedEdgeIds, setDeletedEdgeIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sincroniza la sub-pestaña con el filtro del hook
  useEffect(() => {
    if (mainTab === "grafo") {
      logic.setRelationFilter(graphView === "polaridad" ? "polaridad" : "otros");
    }
  }, [graphView, mainTab, logic]);

  // Cargar nodos al entrar en modo edición y ordenarlos ascendentemente
  useEffect(() => {
    if (mainTab === "editar") {
      const sorted = [...logic.masterData.nodes].sort((a, b) => Number(a.id) - Number(b.id));
      setTempNodes(sorted);

      // Cargar relaciones lógicas válidas para edición
      const validTypes = RELATIONS_CONFIG.map(r => r.id.toUpperCase());
      const filteredEdges = logic.masterData.edges.filter((edge: any) => 
        validTypes.includes(edge.label.toUpperCase())
      );
      setTempEdges(filteredEdges);
      setDeletedEdgeIds([]);
    }
  }, [mainTab, logic.masterData.nodes, logic.masterData.edges]);

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

  /**
   * GUARDAR SOLO CONCEPTOS
   */
  const handleSaveConcepts = async () => {
    setIsSaving(true);
    try {
      const nodeUpdates = tempNodes
        .map(node => {
          const originalNode = logic.masterData.nodes.find(n => n.id === node.id);
          const oldName = originalNode?.data?.label || originalNode?.data?.name;
          const newName = node.data.label;
          if (oldName && newName && oldName !== newName) return { oldName, newName };
          return null;
        })
        .filter(Boolean) as { oldName: string, newName: string }[];

      if (nodeUpdates.length > 0) {
        await grafoService.updateConcepts(resolvedParams.id, nodeUpdates);
        await logic.refreshGraph(); 
      }
      setMainTab("grafo");
    } catch (error) {
      console.error("Error al guardar conceptos:", error);
      alert("No se pudieron guardar los cambios en los conceptos.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * GUARDAR SOLO RELACIONES
   */
  const handleSaveRelationships = async () => {
    setIsSaving(true);
    try {
      const edgeUpdates = tempEdges
        .map(edge => {
          const original = logic.masterData.edges.find((e: any) => e.id === edge.id);
          if (original && original.label.toUpperCase() !== edge.label.toUpperCase()) {
            return { id: edge.id, newType: edge.label.toUpperCase() };
          }
          return null;
        })
        .filter(Boolean);

      if (edgeUpdates.length > 0 || deletedEdgeIds.length > 0) {
        await grafoService.updateEdges(resolvedParams.id, edgeUpdates, deletedEdgeIds);
        await logic.refreshGraph();
      }
      setMainTab("grafo");
    } catch (error) {
      console.error("Error al guardar relaciones:", error);
      alert("No se pudieron guardar los cambios en las relaciones.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-[#222222] relative flex flex-col min-h-screen font-sans text-white">
      {isSaving && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center cursor-wait">
          <div className="w-12 h-12 border-4 border-[#1e90ff] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-black uppercase tracking-widest text-sm animate-pulse">Sincronizando Grafo...</p>
        </div>
      )}

      {!isFullscreen && (
        <header className="p-8 pb-4 flex flex-col items-center animate-fade-in relative">
          <div className="flex flex-col items-center w-full max-w-2xl">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none text-center mb-6">
              {logic.graphTitle}
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
              <button 
                onClick={() => setMainTab("editar")} 
                className={cn("pb-3 text-xs font-black uppercase tracking-[0.2em] transition-all",
                  mainTab === "editar" ? "text-[#1e90ff] border-b-2 border-[#1e90ff]" : "text-gray-500 hover:text-white"
                )}
              >
                Editar
              </button>
            </div>

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

            {mainTab === "editar" && (
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
        ) : (
          <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[70vh] flex flex-col bg-[#1a1a1a] rounded-[40px] border border-white/10 shadow-2xl">
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              {editTab === "conceptos" ? (
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-4">
                      <th className="pb-4 pl-4">ID</th>
                      <th className="pb-4">Autor</th>
                      <th className="pb-4">Concepto Extraído</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempNodes.map((node, idx) => {
                      const authorColor = node.data?.color || "#555";
                      const authorName = node.data?.authorName || "IA / Sistema";
                      return (
                        <tr key={node.id} className="bg-white/5 hover:bg-white/[0.08] transition-colors group">
                          <td className="py-4 pl-4 rounded-l-2xl text-[10px] font-bold text-[#1e90ff] w-16">
                            #{node.id}
                          </td>
                          <td className="py-4 w-48">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: authorColor, border: '2px solid rgba(255,255,255,0.1)' }} />
                              <span className="text-[11px] font-black uppercase tracking-wider text-gray-300">{authorName}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-4 rounded-r-2xl">
                            <input 
                              className="bg-transparent border-b border-transparent group-hover:border-white/10 focus:border-[#1e90ff] outline-none text-sm py-1 w-full transition-all text-gray-100 italic"
                              value={node.data.label}
                              onChange={(e) => {
                                const newNodes = [...tempNodes];
                                newNodes[idx] = { ...newNodes[idx], data: { ...newNodes[idx].data, label: e.target.value } };
                                setTempNodes(newNodes);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-4">
                      <th className="pb-4 pl-4">Origen</th>
                      <th className="pb-4">Vínculo (Tipo)</th>
                      <th className="pb-4">Destino</th>
                      <th className="pb-4 text-right pr-4">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempEdges.map((edge, idx) => {
                      const sourceNode = logic.masterData.nodes.find((n: any) => n.id === edge.source);
                      const targetNode = logic.masterData.nodes.find((n: any) => n.id === edge.target);
                      const isDeleted = deletedEdgeIds.includes(edge.id);
                      return (
                        <tr key={edge.id} className={cn("bg-white/5 transition-all group", isDeleted ? "opacity-20 grayscale pointer-events-none" : "hover:bg-white/[0.08]")}>
                          <td className="py-4 pl-4 rounded-l-2xl">
                            <div className="text-[11px] font-bold text-gray-300 truncate max-w-[200px]">{sourceNode?.data?.label || "Desconocido"}</div>
                          </td>
                          <td className="py-4">
                            <select 
                              className="bg-[#222] border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#1e90ff] focus:outline-none"
                              value={edge.label.toLowerCase()}
                              onChange={(e) => {
                                const newEdges = [...tempEdges];
                                newEdges[idx] = { ...newEdges[idx], label: e.target.value.toUpperCase() };
                                setTempEdges(newEdges);
                              }}
                            >
                              {RELATIONS_CONFIG.map(rel => (
                                <option key={rel.id} value={rel.id}>{rel.nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4">
                            <div className="text-[11px] font-bold text-gray-300 truncate max-w-[200px]">{targetNode?.data?.label || "Desconocido"}</div>
                          </td>
                          <td className="py-4 text-right pr-4 rounded-r-2xl">
                            <button onClick={() => setDeletedEdgeIds(prev => [...prev, edge.id])} className="p-2 text-red-400 hover:text-red-500 transition-all">🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="mt-8 flex justify-end gap-4 border-t border-white/5 pt-6">
              <button onClick={() => setMainTab("grafo")} className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">Cancelar</button>
              
              {editTab === "conceptos" ? (
                <button 
                  onClick={handleSaveConcepts} 
                  className="px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#1e90ff] text-white shadow-[0_10px_20px_-5px_rgba(30,144,255,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  Guardar Conceptos
                </button>
              ) : (
                <button 
                  onClick={handleSaveRelationships} 
                  className="px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#1e90ff] text-white shadow-[0_10px_20px_-5px_rgba(30,144,255,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  Guardar Relaciones
                </button>
              )}
            </div>
          </div>
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