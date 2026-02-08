import { RELATIONS_CONFIG } from "@/app/nuevo/subir-archivo/constants";
import { cn } from "@/lib/utils";

interface EditPanelViewProps {
  editTab: "conceptos" | "relaciones";
  tempNodes: any[];
  setTempNodes: (nodes: any[]) => void;
  tempEdges: any[];
  setTempEdges: (edges: any[]) => void;
  deletedEdgeIds: string[];
  setDeletedEdgeIds: (ids: any) => void;
  masterNodes: any[];
  onSaveConcepts: () => void;
  onSaveRelationships: () => void;
  onCancel: () => void;
}

export function EditPanelView({
  editTab, tempNodes, setTempNodes, tempEdges, setTempEdges, 
  deletedEdgeIds, setDeletedEdgeIds, masterNodes, 
  onSaveConcepts, onSaveRelationships, onCancel
}: EditPanelViewProps) {
  return (
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
                const sourceNode = masterNodes.find((n: any) => n.id === edge.source);
                const targetNode = masterNodes.find((n: any) => n.id === edge.target);
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
                      <button onClick={() => setDeletedEdgeIds((prev: any) => [...prev, edge.id])} className="p-2 text-red-400 hover:text-red-500 transition-all">🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mt-8 flex justify-end gap-4 border-t border-white/5 pt-6">
        <button onClick={onCancel} className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">Cancelar</button>
        <button 
          onClick={editTab === "conceptos" ? onSaveConcepts : onSaveRelationships} 
          className="px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#1e90ff] text-white shadow-[0_10px_20px_-5px_rgba(30,144,255,0.4)] hover:scale-105 active:scale-95 transition-all"
        >
          {editTab === "conceptos" ? "Guardar Conceptos" : "Guardar Relaciones"}
        </button>
      </div>
    </div>
  );
}