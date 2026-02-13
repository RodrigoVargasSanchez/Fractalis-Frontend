import { useState, useMemo } from "react";
import { RELATIONS_CONFIG } from "@/app/nuevo/subir-archivo/constants";
import { cn } from "@/lib/utils";
import { grafoService } from "@/services/grafoService";

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

  console.log("=== DEBUG EDIT PANEL ===");
  console.log("ID del Proyecto (pid):", pid);
  console.log("Nodos Actuales (tempNodes):", tempNodes);
  console.log("Relaciones Actuales (tempEdges):", tempEdges);
  console.log("Secuencia Maestra (movieSequence):", movieSequence);
  console.log("========================");
  
  // Estados para Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);

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

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[70vh] flex flex-col bg-[#1a1a1a] rounded-[40px] border border-white/10 shadow-2xl relative text-white">
      
      {/* MODAL NUEVO CONCEPTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#222] border border-white/10 p-8 rounded-[30px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black uppercase tracking-tighter italic mb-6 text-[#1e90ff]">Vincular Nuevo Concepto</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-widest">1. Participante</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff]" value={selectedAuthor} onChange={(e) => { setSelectedAuthor(e.target.value); setSelectedOpinionId(""); }}>
                  <option value="">Seleccione autor...</option>
                  {authors.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className={cn("transition-all", !selectedAuthor && "opacity-20 pointer-events-none")}>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-widest">2. Intervención</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff]" value={selectedOpinionId} onChange={(e) => setSelectedOpinionId(e.target.value)}>
                  <option value="">{filteredOpinionsForConcept.length > 0 ? "Seleccione la frase..." : "Sin intervenciones"}</option>
                  {filteredOpinionsForConcept.map((op: any) => (<option key={op.id} value={op.id}>Ronda {op.ronda || '?'}: {op.text?.substring(0, 45)}...</option>))}
                </select>
              </div>
              <div className={cn("transition-all", !selectedOpinionId && "opacity-20 pointer-events-none")}>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-widest">3. Nombre del Concepto</label>
                <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff] italic" placeholder="Ej: Sostenibilidad" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={resetModals} className="flex-1 px-4 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all">Cancelar</button>
              <button disabled={!newName || !selectedOpinionId} onClick={() => { handleCreateNewConcept(newName, selectedOpinionId); resetModals(); }} className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase bg-[#1e90ff] text-white disabled:opacity-20 shadow-lg active:scale-95 transition-all">Vincular y Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA RELACIÓN (ACTUALIZADO CON TRAZABILIDAD) */}
      {isRelModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#222] border border-white/10 p-8 rounded-[30px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black uppercase tracking-tighter italic mb-6 text-[#1e90ff]">Crear Nueva Relación</h2>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-widest">1. Autor de la Relación</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff]" value={relAuthor} onChange={(e) => { setRelAuthor(e.target.value); setRelOpinionId(""); }}>
                  <option value="">Seleccione participante...</option>
                  {authors.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className={cn("transition-all", !relAuthor && "opacity-20 pointer-events-none")}>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-widest">2. Basado en Intervención</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff]" value={relOpinionId} onChange={(e) => setRelOpinionId(e.target.value)}>
                  <option value="">Seleccione evidencia...</option>
                  {filteredOpinionsForRelation.map((op: any) => (<option key={op.id} value={op.id}>Ronda {op.ronda}: {op.text?.substring(0, 40)}...</option>))}
                </select>
              </div>
              <div className={cn("grid grid-cols-2 gap-3 transition-all", !relOpinionId && "opacity-20 pointer-events-none")}>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block tracking-widest">Origen</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white outline-none" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                    <option value="">Origen...</option>
                    {tempNodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block tracking-widest">Destino</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white outline-none" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                    <option value="">Destino...</option>
                    {tempNodes.filter(n => n.id !== sourceId).map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                  </select>
                </div>
              </div>
              <div className={cn("transition-all", !targetId && "opacity-20 pointer-events-none")}>
                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-widest">Tipo de Vínculo</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#1e90ff]" value={relType} onChange={(e) => setRelType(e.target.value)}>
                  <option value="">Seleccione tipo...</option>
                  {RELATIONS_CONFIG.map(rel => <option key={rel.id} value={rel.id}>{rel.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={resetModals} className="flex-1 px-4 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all">Cancelar</button>
              <button disabled={!relType || !relOpinionId} onClick={handleCreateEdge} className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase bg-[#1e90ff] text-white disabled:opacity-20 shadow-lg active:scale-95 transition-all">Crear Vínculo</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        {editTab === "conceptos" ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest italic">Edición de Conceptos Extraídos</p>
              <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-[#1e90ff] hover:bg-[#1e90ff]/80 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg flex items-center gap-2"><span>+</span> Añadir Concepto</button>
            </div>
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-4">
                  <th className="pb-4 pl-4">ID</th>
                  <th className="pb-4">Autor</th>
                  <th className="pb-4">Concepto Extraído</th>
                  <th className="pb-4 text-right pr-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {tempNodes.map((node) => (
                  <tr key={node.id} className="bg-white/5 hover:bg-white/[0.08] transition-colors group">
                    <td className="py-4 pl-4 rounded-l-2xl text-[10px] font-bold text-[#1e90ff] w-16">#{node.id}</td>
                    <td className="py-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: node.data?.color || "#555", border: '2px solid rgba(255,255,255,0.1)' }} />
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-300">{node.data?.authorName || "IA"}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <input className="bg-transparent border-b border-transparent group-hover:border-white/10 focus:border-[#1e90ff] outline-none text-sm py-1 w-full transition-all text-gray-100 italic" value={node.data.label} onChange={(e) => { 
                        const newNodes = tempNodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: e.target.value } } : n);
                        setTempNodes(newNodes); 
                      }} />
                    </td>
                    <td className="py-4 text-right pr-4 rounded-r-2xl">
                      <button onClick={() => handleDeleteConcept(node.id)} className="p-2 text-red-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest italic">Gestión de Vínculos Semánticos</p>
              <button onClick={() => setIsRelModalOpen(true)} className="px-6 py-2 bg-[#1e90ff] hover:bg-[#1e90ff]/80 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg flex items-center gap-2"><span>+</span> Añadir Relación</button>
            </div>
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-4">
                  <th className="pb-4 pl-4">Origen</th>
                  <th className="pb-4">Vínculo</th>
                  <th className="pb-4">Destino</th>
                  <th className="pb-4 text-right pr-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {tempEdges
                  .filter((edge) => 
                    RELATIONS_CONFIG.some(config => config.id.toUpperCase() === edge.label.toUpperCase())
                  )
                  .map((edge) => {
                    const sourceNode = tempNodes.find((n: any) => n.id === edge.source) || masterNodes.find((n: any) => n.id === edge.source);
                    const targetNode = tempNodes.find((n: any) => n.id === edge.target) || masterNodes.find((n: any) => n.id === edge.target);
                    
                    return (
                      <tr key={edge.id} className="bg-white/5 transition-all group hover:bg-white/[0.08]">
                        <td className="py-4 pl-4 rounded-l-2xl text-[11px] font-bold text-gray-300">{sourceNode?.data?.label || "Desconocido"}</td>
                        <td className="py-4">
                          <select 
                            className="bg-[#222] border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-[#1e90ff] outline-none" 
                            value={edge.label.toLowerCase()} 
                            onChange={(e) => { 
                              const newEdges = tempEdges.map(ed => ed.id === edge.id ? { ...ed, label: e.target.value.toUpperCase() } : ed);
                              setTempEdges(newEdges); 
                            }}
                          >
                            {RELATIONS_CONFIG.map(rel => (
                              <option key={rel.id} value={rel.id.toLowerCase()}>{rel.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 text-[11px] font-bold text-gray-300">{targetNode?.data?.label || "Desconocido"}</td>
                        <td className="py-4 text-right pr-4 rounded-r-2xl">
                          <button onClick={() => handleDeleteEdge(edge.id)} className="p-2 text-red-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </>
        )}
      </div>
      
      <div className="mt-8 flex justify-end gap-4 border-t border-white/5 pt-6">
        <button onClick={onCancel} className="px-8 py-3 rounded-xl text-xs font-black uppercase text-gray-400 hover:text-white transition-all">Cancelar</button>
        <button 
          onClick={editTab === "conceptos" ? onSaveConcepts : onSaveRelationships} 
          className="px-10 py-3 rounded-xl text-xs font-black uppercase bg-[#1e90ff] text-white shadow-lg active:scale-95 transition-all"
        >
          {editTab === "conceptos" ? "Guardar Cambios" : "Guardar Relaciones"}
        </button>
      </div>
    </div>
  );
}