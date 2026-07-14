import { useState, useMemo, useEffect } from "react";
import { RELATIONS_CONFIG } from "@/app/nuevo/subir-archivo/constants";
import { cn } from "@/lib/utils";
import { grafoService } from "@/services/grafoService";
import { 
  Search, Plus, Trash2, Tag, Activity, 
  Check, X, AlertCircle, FileText, User, ChevronRight, Save, Undo2, Pencil, Eye
} from "lucide-react";

interface EditPanelViewProps {
  pid: string | number;
  editTab: "conceptos" | "relaciones";
  tempNodes: any[];
  setTempNodes: (nodes: any[]) => void;
  tempEdges: any[];
  setTempEdges: (edges: any[]) => void;
  deletedEdgeIds: string[];
  setDeletedEdgeIds: (ids: any) => void;
  masterNodes: any[];
  movieSequence: any[]; 
  onSaveConcepts: () => void;
  onSaveRelationships: () => void;
  onCancel: () => void;
  handleCreateNewConcept: (name: string, opinionId: string) => void;
  onRefresh: () => void;
}

export function EditPanelView({
  pid, editTab, tempNodes, setTempNodes, tempEdges, setTempEdges, 
  deletedEdgeIds, setDeletedEdgeIds, masterNodes,
  movieSequence, 
  onSaveConcepts, onSaveRelationships, onCancel,
  handleCreateNewConcept,
  onRefresh
}: EditPanelViewProps) {

  // Estados para Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);

  // Estado para buscador
  const [searchQuery, setSearchQuery] = useState("");

  // Resetear buscador al cambiar de pestaña
  useEffect(() => {
    setSearchQuery("");
  }, [editTab]);

  // Estados Formulario Concepto
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedOpinionId, setSelectedOpinionId] = useState("");
  const [newName, setNewName] = useState("");

  // Estados Formulario Relación
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relType, setRelType] = useState("");
  const [relAuthor, setRelAuthor] = useState("");
  const [relOpinionId, setRelOpinionId] = useState("");

  const authors = useMemo(() => {
    if (!movieSequence) return [];
    const names = movieSequence.map(item => item.authorName).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [movieSequence]);

  // Filtrado de opiniones dinámico para ambos modales
  const getFilteredOpinions = (author: string) => {
    if (!author || !movieSequence) return [];
    const uniqueMap = new Map();
    movieSequence.forEach(item => {
      if (item.authorName === author && item.opinionId) {
        if (!uniqueMap.has(item.opinionId)) {
          uniqueMap.set(item.opinionId, {
            id: item.opinionId,
            ronda: item.ronda,
            text: item.opinionContent
          });
        }
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => (a.ronda || 0) - (b.ronda || 0));
  };

  const filteredOpinionsForConcept = useMemo(() => getFilteredOpinions(selectedAuthor), [selectedAuthor, movieSequence]);
  const filteredOpinionsForRelation = useMemo(() => getFilteredOpinions(relAuthor), [relAuthor, movieSequence]);

  const resetModals = () => {
    setIsModalOpen(false);
    setIsRelModalOpen(false);
    setSelectedAuthor("");
    setSelectedOpinionId("");
    setNewName("");
    setSourceId("");
    setTargetId("");
    setRelType("");
    setRelAuthor("");
    setRelOpinionId("");
  };

  const handleDeleteConcept = async (nodeId: string) => {
    if (!confirm("⚠️ ¿Estás seguro de eliminar este concepto? Se borrarán sus relaciones.")) return;
    try {
      await grafoService.deleteConcept(nodeId);
      setTempNodes(tempNodes.filter(n => n.id !== nodeId));
      setTempEdges(tempEdges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
      onRefresh();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const handleDeleteEdge = async (edgeId: string) => {
    if (!confirm("⚠️ ¿Deseas eliminar esta relación de forma permanente?")) return;
    try {
      await grafoService.updateEdges(pid.toString(), [], [edgeId]); 
      setTempEdges(tempEdges.filter(e => e.id !== edgeId));
      onRefresh();
    } catch (error: any) {
      alert("No se pudo eliminar la relación.");
    }
  };

  const handleCreateEdge = async () => {
    try {
      if (!sourceId || !targetId || !relType || !relOpinionId) {
        alert("Por favor completa todos los campos, incluyendo el autor y la intervención de origen.");
        return;
      }

      const response = await grafoService.createEdge(pid, sourceId, targetId, relType, relOpinionId);
      
      const sourceNode = tempNodes.find(n => n.id === sourceId) || masterNodes.find(n => n.id === sourceId);
      const authorColor = sourceNode?.data?.color || "#1e90ff";

      const newEdge = {
        id: response.edgeId?.toString() || `new-${Date.now()}`,
        source: sourceId,
        target: targetId,
        label: relType.toUpperCase(),
        type: 'smoothstep',
        data: {
          authorName: relAuthor,
          opinionId: relOpinionId
        },
        style: {
          stroke: authorColor,
          strokeWidth: 2,
        },
        animated: ['CAUSALIDAD', 'DEPENDENCIA'].includes(relType.toUpperCase())
      };

      setTempEdges([...tempEdges, newEdge]);
      resetModals();
      onRefresh(); 
    } catch (error: any) {
      alert("Error al crear relación: " + error.message);
    }
  };

  // Helper para trazabilidad: Buscar intervención/evidencia asociada a un nodo
  const getNodeIntervention = (node: any) => {
    if (node.data?.opinionId) {
      const found = movieSequence?.find(m => m.opinionId === node.data.opinionId);
      if (found) return found;
    }
    return movieSequence?.find(m => m.name?.toLowerCase() === node.data?.label?.toLowerCase());
  };

  // Filtrar Conceptos por buscador
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return tempNodes;
    const q = searchQuery.toLowerCase().trim();
    return tempNodes.filter(node => 
      node.id.toString().includes(q) || 
      (node.data?.label || "").toLowerCase().includes(q) ||
      (node.data?.authorName || "").toLowerCase().includes(q)
    );
  }, [tempNodes, searchQuery]);

  // Filtrar Relaciones por buscador
  const filteredEdges = useMemo(() => {
    const configuredEdges = tempEdges.filter((edge) => 
      RELATIONS_CONFIG.some(config => config.id.toUpperCase() === edge.label.toUpperCase())
    );
    if (!searchQuery.trim()) return configuredEdges;
    const q = searchQuery.toLowerCase().trim();
    return configuredEdges.filter(edge => {
      const sourceNode = tempNodes.find((n: any) => n.id === edge.source) || masterNodes.find((n: any) => n.id === edge.source);
      const targetNode = tempNodes.find((n: any) => n.id === edge.target) || masterNodes.find((n: any) => n.id === edge.target);
      return (
        edge.id.toString().includes(q) ||
        edge.label.toLowerCase().includes(q) ||
        (sourceNode?.data?.label || "").toLowerCase().includes(q) ||
        (targetNode?.data?.label || "").toLowerCase().includes(q) ||
        (edge.data?.authorName || "").toLowerCase().includes(q)
      );
    });
  }, [tempEdges, tempNodes, masterNodes, searchQuery]);

  // Calcular pasos dinámicos para los modales
  const currentStep = useMemo(() => {
    if (!selectedAuthor) return 1;
    if (!selectedOpinionId) return 2;
    return 3;
  }, [selectedAuthor, selectedOpinionId]);

  const currentRelStep = useMemo(() => {
    if (!relAuthor || !relOpinionId) return 1;
    if (!sourceId || !targetId) return 2;
    return 3;
  }, [relAuthor, relOpinionId, sourceId, targetId]);

  return (
    <div className="max-w-6xl w-full mx-auto px-8 pb-6 flex-grow flex-1 min-h-0 flex flex-col bg-[#141414]/90 backdrop-blur-xl border border-white/10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] rounded-[40px] relative text-white animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* MODAL NUEVO CONCEPTO (DISEÑO PREMIUM POR PASOS Y CON BACKDROP DENSE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#181818]/95 border border-white/10 p-8 rounded-[32px] w-full max-w-lg shadow-[0_20px_50px_rgba(30,144,255,0.15)] animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1e90ff] flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Vincular Nuevo Concepto
              </h2>
              <button onClick={resetModals} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Visual */}
            <div className="flex items-center justify-between px-4 relative mb-2">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/5 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-[2px] bg-[#1e90ff] -translate-y-1/2 z-0 transition-all duration-300"
                style={{ width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%" }}
              />
              
              <div className="flex flex-col items-center relative z-10">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                  selectedAuthor 
                    ? "bg-green-500 border-green-500 text-white animate-pulse" 
                    : "bg-[#181818] border-[#1e90ff] text-[#1e90ff] shadow-[0_0_10px_rgba(30,144,255,0.2)]"
                )}>
                  {selectedAuthor ? <Check className="w-3.5 h-3.5" /> : "1"}
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-wider mt-1.5", selectedAuthor ? "text-green-400" : "text-[#1e90ff]")}>Autor</span>
              </div>

              <div className="flex flex-col items-center relative z-10">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                  selectedOpinionId 
                    ? "bg-green-500 border-green-500 text-white animate-pulse" 
                    : selectedAuthor
                      ? "bg-[#181818] border-[#1e90ff] text-[#1e90ff]"
                      : "bg-[#222] border-white/5 text-gray-600"
                )}>
                  {selectedOpinionId ? <Check className="w-3.5 h-3.5" /> : "2"}
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-wider mt-1.5", selectedOpinionId ? "text-green-400" : selectedAuthor ? "text-white" : "text-gray-600")}>Frase</span>
              </div>

              <div className="flex flex-col items-center relative z-10">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                  newName.trim()
                    ? "bg-green-500 border-green-500 text-white"
                    : selectedOpinionId
                      ? "bg-[#181818] border-[#1e90ff] text-[#1e90ff]"
                      : "bg-[#222] border-white/5 text-gray-600"
                )}>
                  "3"
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-wider mt-1.5", newName.trim() ? "text-green-400" : selectedOpinionId ? "text-white" : "text-gray-600")}>Concepto</span>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-[#1e90ff]" />
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">1. Participante de Origen</label>
                </div>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff] transition-all cursor-pointer" 
                  value={selectedAuthor} 
                  onChange={(e) => { setSelectedAuthor(e.target.value); setSelectedOpinionId(""); }}
                >
                  <option value="" className="bg-[#181818] text-gray-500">Seleccione autor...</option>
                  {authors.map(a => <option key={a} value={a} className="bg-[#181818] text-white">{a}</option>)}
                </select>
              </div>

              <div className={cn(
                "bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all duration-300", 
                !selectedAuthor ? "opacity-25 pointer-events-none scale-98" : "opacity-100"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5 text-[#1e90ff]" />
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">2. Frase de Referencia (Evidencia)</label>
                </div>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff] transition-all cursor-pointer" 
                  value={selectedOpinionId} 
                  onChange={(e) => setSelectedOpinionId(e.target.value)}
                >
                  <option value="" className="bg-[#181818] text-gray-500">
                    {filteredOpinionsForConcept.length > 0 ? "Seleccione la frase..." : "Sin frases disponibles"}
                  </option>
                  {filteredOpinionsForConcept.map((op: any) => (
                    <option key={op.id} value={op.id} className="bg-[#181818] text-white">
                      Ronda {op.ronda || '?'}: {op.text?.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className={cn(
                "bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all duration-300", 
                !selectedOpinionId ? "opacity-25 pointer-events-none scale-98" : "opacity-100"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-[#1e90ff]" />
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">3. Nombre del Concepto a Extraer</label>
                </div>
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff] transition-all italic placeholder-white/10" 
                  placeholder="Ej: Innovación Sostenible" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex gap-4 mt-4 border-t border-white/5 pt-4">
              <button onClick={resetModals} className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                Cancelar
              </button>
              <button 
                disabled={!newName || !selectedOpinionId} 
                onClick={() => { handleCreateNewConcept(newName, selectedOpinionId); resetModals(); }} 
                className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase bg-[#1e90ff] text-white disabled:opacity-20 shadow-lg shadow-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Vincular y Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA RELACIÓN (ACTUALIZADO POR PASOS Y CON TRAZABILIDAD COMPLETA) */}
      {isRelModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#181818]/95 border border-white/10 p-8 rounded-[32px] w-full max-w-lg shadow-[0_20px_50px_rgba(30,144,255,0.15)] animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1e90ff] flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Crear Nueva Relación
              </h2>
              <button onClick={resetModals} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Visual */}
            <div className="flex items-center justify-between px-4 relative mb-2">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/5 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-[2px] bg-[#1e90ff] -translate-y-1/2 z-0 transition-all duration-300"
                style={{ width: currentRelStep === 1 ? "0%" : currentRelStep === 2 ? "50%" : "100%" }}
              />
              
              <div className="flex flex-col items-center relative z-10">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                  relOpinionId 
                    ? "bg-green-500 border-green-500 text-white animate-pulse" 
                    : "bg-[#181818] border-[#1e90ff] text-[#1e90ff] shadow-[0_0_10px_rgba(30,144,255,0.2)]"
                )}>
                  {relOpinionId ? <Check className="w-3.5 h-3.5" /> : "1"}
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-wider mt-1.5", relOpinionId ? "text-green-400" : "text-[#1e90ff]")}>Evidencia</span>
              </div>

              <div className="flex flex-col items-center relative z-10">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                  sourceId && targetId
                    ? "bg-green-500 border-green-500 text-white animate-pulse" 
                    : relOpinionId
                      ? "bg-[#181818] border-[#1e90ff] text-[#1e90ff]"
                      : "bg-[#222] border-white/5 text-gray-600"
                )}>
                  {sourceId && targetId ? <Check className="w-3.5 h-3.5" /> : "2"}
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-wider mt-1.5", sourceId && targetId ? "text-green-400" : relOpinionId ? "text-white" : "text-gray-600")}>Dirección</span>
              </div>

              <div className="flex flex-col items-center relative z-10">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                  relType
                    ? "bg-green-500 border-green-500 text-white"
                    : (sourceId && targetId)
                      ? "bg-[#181818] border-[#1e90ff] text-[#1e90ff]"
                      : "bg-[#222] border-white/5 text-gray-600"
                )}>
                  "3"
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-wider mt-1.5", relType ? "text-green-400" : (sourceId && targetId) ? "text-white" : "text-gray-600")}>Vínculo</span>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 transition-all">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-[#1e90ff]" />
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Autor</label>
                    </div>
                    <select 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#1e90ff] transition-all cursor-pointer" 
                      value={relAuthor} 
                      onChange={(e) => { setRelAuthor(e.target.value); setRelOpinionId(""); }}
                    >
                      <option value="" className="bg-[#181818] text-gray-500">Participante...</option>
                      {authors.map(a => <option key={a} value={a} className="bg-[#181818] text-white">{a}</option>)}
                    </select>
                  </div>

                  <div className={cn("transition-all duration-300", !relAuthor && "opacity-25 pointer-events-none")}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-3.5 h-3.5 text-[#1e90ff]" />
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Evidencia</label>
                    </div>
                    <select 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#1e90ff] transition-all cursor-pointer" 
                      value={relOpinionId} 
                      onChange={(e) => setRelOpinionId(e.target.value)}
                    >
                      <option value="" className="bg-[#181818] text-gray-500">Evidencia...</option>
                      {filteredOpinionsForRelation.map((op: any) => (
                        <option key={op.id} value={op.id} className="bg-[#181818] text-white">
                          Ronda {op.ronda}: {op.text?.substring(0, 35)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={cn(
                "grid grid-cols-2 gap-4 transition-all duration-300 p-4 bg-white/[0.02] border border-white/5 rounded-2xl", 
                !relOpinionId ? "opacity-25 pointer-events-none scale-98" : "opacity-100"
              )}>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block tracking-wider">Concepto Origen</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#1e90ff] cursor-pointer" 
                    value={sourceId} 
                    onChange={(e) => setSourceId(e.target.value)}
                  >
                    <option value="" className="bg-[#181818] text-gray-500">Origen...</option>
                    {tempNodes.map(n => <option key={n.id} value={n.id} className="bg-[#181818] text-white">{n.data.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block tracking-wider">Concepto Destino</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#1e90ff] cursor-pointer" 
                    value={targetId} 
                    onChange={(e) => setTargetId(e.target.value)}
                  >
                    <option value="" className="bg-[#181818] text-gray-500">Destino...</option>
                    {tempNodes.filter(n => n.id !== sourceId).map(n => <option key={n.id} value={n.id} className="bg-[#181818] text-white">{n.data.label}</option>)}
                  </select>
                </div>
              </div>

              <div className={cn(
                "transition-all duration-300 p-4 bg-white/[0.02] border border-white/5 rounded-2xl", 
                !targetId ? "opacity-25 pointer-events-none scale-98" : "opacity-100"
              )}>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Tipo de Vínculo</label>
                <select 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff] cursor-pointer" 
                  value={relType} 
                  onChange={(e) => setRelType(e.target.value)}
                >
                  <option value="" className="bg-[#181818] text-gray-500">Seleccione tipo de relación...</option>
                  {RELATIONS_CONFIG.map(rel => <option key={rel.id} value={rel.id} className="bg-[#181818] text-white">{rel.nombre}</option>)}
                </select>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex gap-4 mt-4 border-t border-white/5 pt-4">
              <button onClick={resetModals} className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                Cancelar
              </button>
              <button 
                disabled={!relType || !relOpinionId} 
                onClick={handleCreateEdge} 
                className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase bg-[#1e90ff] text-white disabled:opacity-20 shadow-lg shadow-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Crear Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DE ACCIONES PRINCIPALES Y BUSCADOR */}
      <div className="pt-8 pb-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e90ff] animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1e90ff] flex items-center gap-1.5">
                {editTab === "conceptos" ? "Edición de Conceptos Extraídos" : "Gestión de Vínculos Semánticos"}
              </h3>
            </div>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1.5">
              {editTab === "conceptos" 
                ? `${filteredNodes.length} de ${tempNodes.length} conceptos en total` 
                : `${filteredEdges.length} de ${tempEdges.length} relaciones en total`
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={editTab === "conceptos" ? "Buscar concepto o participante..." : "Buscar origen, destino o tipo..."}
                className="w-full pl-9 pr-8 py-2 bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#1e90ff] rounded-xl text-xs text-white placeholder-white/20 outline-none transition-all"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Botón Añadir */}
            <button 
              onClick={() => editTab === "conceptos" ? setIsModalOpen(true) : setIsRelModalOpen(true)} 
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1e90ff] hover:bg-[#1e90ff]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editTab === "conceptos" ? "Añadir Concepto" : "Añadir Relación"}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* CUERPO DEL CONTENEDOR - LISTADO REACTIVO */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4 min-h-0">
        {editTab === "conceptos" ? (
          <>
            {filteredNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/[0.01] border border-white/5 rounded-3xl animate-fade-in animate-duration-300">
                <AlertCircle className="w-10 h-10 text-gray-600 mb-3" />
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Sin Conceptos Disponibles</h3>
                <p className="text-[10px] text-gray-500 mt-1 max-w-xs leading-relaxed uppercase">
                  {searchQuery ? "Prueba a cambiar los términos de la búsqueda actual" : "Crea tu primer concepto para este grafo discursivo"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-1">
                {filteredNodes.map((node) => {
                  const authorColor = node.data?.color || "#555";
                  const intervention = getNodeIntervention(node);

                  return (
                    <div 
                      key={node.id} 
                      className="bg-white/[0.02] border border-white/5 hover:border-[#1e90ff]/30 transition-all duration-300 rounded-[24px] p-5 flex flex-col justify-between shadow-md relative group overflow-hidden"
                      style={{ borderLeft: `4px solid ${authorColor}` }}
                    >
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <span className="text-[10px] font-mono font-bold text-gray-500">#{node.id}</span>
                        
                        <div 
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all"
                          style={{ 
                            backgroundColor: `${authorColor}10`, 
                            borderColor: `${authorColor}30`, 
                            color: authorColor 
                          }}
                        >
                          {node.data?.authorName || "IA"}
                        </div>
                      </div>

                      <div className="relative flex items-center mb-3">
                        <Tag className="w-3.5 h-3.5 text-gray-500 absolute left-0" />
                        <input 
                          className="w-full bg-transparent border-b border-transparent hover:border-white/10 focus:border-[#1e90ff] focus:outline-none text-sm pl-6 pr-4 py-0.5 transition-all text-gray-100 italic font-bold"
                          value={node.data.label} 
                          onChange={(e) => { 
                            const newNodes = tempNodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: e.target.value } } : n);
                            setTempNodes(newNodes); 
                          }} 
                        />
                        <Pencil className="w-3 h-3 text-gray-600 absolute right-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {intervention && (
                        <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-400 font-medium leading-relaxed italic flex flex-col gap-1 select-none">
                          <span className="text-[#1e90ff] not-italic font-black text-[8px] uppercase tracking-wider flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            Evidencia en Diálogo:
                          </span>
                          <span className="line-clamp-2">
                            "{intervention.opinionContent}"
                          </span>
                        </div>
                      )}

                      <button 
                        onClick={() => handleDeleteConcept(node.id)} 
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                        title="Eliminar Concepto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {filteredEdges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/[0.01] border border-white/5 rounded-3xl animate-fade-in animate-duration-300">
                <AlertCircle className="w-10 h-10 text-gray-600 mb-3" />
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Sin Relaciones Disponibles</h3>
                <p className="text-[10px] text-gray-500 mt-1 max-w-xs leading-relaxed uppercase">
                  {searchQuery ? "Prueba a cambiar los términos de la búsqueda actual" : "Crea tu primer vínculo semántico entre los conceptos extraídos"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
                {filteredEdges.map((edge) => {
                  const sourceNode = tempNodes.find((n: any) => n.id === edge.source) || masterNodes.find((n: any) => n.id === edge.source);
                  const targetNode = tempNodes.find((n: any) => n.id === edge.target) || masterNodes.find((n: any) => n.id === edge.target);
                  
                  const isCausal = ['CAUSALIDAD', 'DEPENDENCIA'].includes(edge.label.toUpperCase());
                  const authorColor = sourceNode?.data?.color || "#1e90ff";
                  const relOpinion = movieSequence?.find(m => m.opinionId === edge.data?.opinionId);

                  return (
                    <div 
                      key={edge.id} 
                      className="bg-white/[0.02] border border-white/5 hover:border-[#1e90ff]/30 transition-all duration-300 rounded-[28px] p-5 flex flex-col justify-between shadow-md relative group overflow-hidden"
                    >
                      <div className="flex flex-row items-center gap-2 justify-between w-full mb-4">
                        {/* Concepto Origen */}
                        <div 
                          className="bg-black/30 border border-white/5 rounded-2xl p-3 flex-1 flex flex-col justify-center min-w-0"
                          style={{ borderLeft: `3px solid ${sourceNode?.data?.color || '#555'}` }}
                        >
                          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider mb-1 block">Origen</span>
                          <span className="text-xs font-bold text-white truncate italic">{sourceNode?.data?.label || "Desconocido"}</span>
                        </div>

                        {/* Conector Visual */}
                        <div className="flex flex-col items-center justify-center min-w-[100px] sm:min-w-[130px] px-1 relative">
                          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/5 -translate-y-1/2 z-0" />
                          <div className={cn(
                            "absolute top-1/2 left-0 h-[2px] -translate-y-1/2 z-0 transition-all duration-1000",
                            isCausal
                              ? "bg-gradient-to-r from-blue-500 to-[#a855f7] w-full animate-pulse"
                              : "bg-blue-500/50 w-full"
                          )} />
                          
                          <div className="relative z-10 bg-[#161616] border border-white/10 hover:border-[#1e90ff]/50 rounded-xl px-2 py-0.5 text-[9px] text-center font-black uppercase text-[#1e90ff] shadow-sm transition-all flex items-center gap-1 select-none">
                            <select 
                              className="bg-transparent text-center font-black uppercase text-[#1e90ff] outline-none cursor-pointer pr-1 py-0.5 appearance-none text-[9px] min-w-[70px]" 
                              value={edge.label.toLowerCase()} 
                              onChange={(e) => { 
                                const newEdges = tempEdges.map(ed => ed.id === edge.id ? { ...ed, label: e.target.value.toUpperCase() } : ed);
                                setTempEdges(newEdges); 
                              }}
                            >
                              {RELATIONS_CONFIG.map(rel => (
                                <option key={rel.id} className="bg-[#181818] text-white" value={rel.id.toLowerCase()}>{rel.nombre}</option>
                              ))}
                            </select>
                            <ChevronRight className="w-3 h-3 text-[#1e90ff] pointer-events-none" />
                          </div>
                        </div>

                        {/* Concepto Destino */}
                        <div 
                          className="bg-black/30 border border-white/5 rounded-2xl p-3 flex-1 flex flex-col justify-center min-w-0"
                          style={{ borderLeft: `3px solid ${targetNode?.data?.color || '#555'}` }}
                        >
                          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider mb-1 block">Destino</span>
                          <span className="text-xs font-bold text-white truncate italic">{targetNode?.data?.label || "Desconocido"}</span>
                        </div>
                      </div>

                      {relOpinion && (
                        <div className="mt-2 pt-3 border-t border-white/5 text-[10px] text-gray-400 font-medium leading-relaxed italic flex flex-col gap-1 select-none">
                          <span 
                            className="not-italic font-black text-[8px] uppercase tracking-wider flex items-center gap-1"
                            style={{ color: authorColor }}
                          >
                            <Eye className="w-2.5 h-2.5" />
                            Evidencia ({edge.data?.authorName || "IA"} - R{relOpinion.ronda}):
                          </span>
                          <span className="line-clamp-2">
                            "{relOpinion.opinionContent}"
                          </span>
                        </div>
                      )}

                      <button 
                        onClick={() => handleDeleteEdge(edge.id)} 
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                        title="Eliminar Relación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* BARRA DE ACCIONES DE PIE DE PÁGINA */}
      <div className="mt-4 flex justify-end gap-4 border-t border-white/5 pt-6 flex-shrink-0">
        <button 
          onClick={onCancel} 
          className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
          Cancelar
        </button>
        <button 
          onClick={editTab === "conceptos" ? onSaveConcepts : onSaveRelationships} 
          className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-[#1e90ff] text-white hover:from-blue-500 hover:to-blue-400 shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {editTab === "conceptos" ? "Guardar Cambios" : "Guardar Relaciones"}
        </button>
      </div>
    </div>
  );
}