import { cn } from "@/lib/utils";
// Importamos los colores desde tu archivo de constantes
import { RELATION_COLORS } from "@/app/espacios/grafo/[id]/constants";

interface StatsPanelViewProps {
  activeTab: "conceptos" | "relaciones";
  nodes: any[];
  edges: any[];
  totalObservations?: number;
}

export function StatsPanelView({ activeTab, nodes, edges, totalObservations = 1 }: StatsPanelViewProps) {
  
  const getIntencionalidad = (val: number, frecuencia: number) => {
    return frecuencia > 0 ? val / frecuencia : 0;
  };

  const getFrecuenciaNormalizada = (frecuencia: number) => {
    return (frecuencia / totalObservations).toFixed(2);
  };

  return (
    <div className="mx-8 my-4 bg-[#0d0d0d] rounded-[40px] border border-white/10 shadow-2xl h-[70vh] overflow-hidden flex flex-col animate-fade-in">
      <div className="flex-1 overflow-auto custom-scrollbar p-8">
        {activeTab === "conceptos" ? (
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                <th className="pb-4 pl-6">Concepto</th>
                <th className="pb-4">Frecuencia (Uso)</th>
                <th className="pb-4">Intencionalidad (Promedio)</th>
                <th className="pb-4">Grado Acuerdo</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, idx) => {
                const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
                const frecuencia = node.frecuencia || nodeEdges.length;
                const intencionalidad = getIntencionalidad(node.sumValues || 0, frecuencia);

                return (
                  <tr key={idx} className="bg-white/5 hover:bg-white/10 transition-colors group">
                    <td className="py-4 pl-6 rounded-l-2xl border-l border-y border-white/5">
                      <span className="font-black text-sm uppercase italic group-hover:text-[#1e90ff] transition-colors">
                        {node.label || node.data?.label || node.id}
                      </span>
                    </td>
                    <td className="py-4 border-y border-white/5 font-mono text-[#1e90ff]">
                      {getFrecuenciaNormalizada(frecuencia)}
                    </td>
                    <td className={cn(
                      "py-4 border-y border-white/5 font-mono font-bold",
                      intencionalidad > 0 ? "text-blue-400" : intencionalidad < 0 ? "text-red-400" : "text-gray-400"
                    )}>
                      {intencionalidad.toFixed(2)}
                    </td>
                    <td className="py-4 rounded-r-2xl border-r border-y border-white/5 text-gray-500 uppercase text-[10px] font-bold">
                      {node.kappaAgreement || "0.00"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                <th className="pb-4 pl-6">Origen</th>
                <th className="pb-4">Destino</th>
                <th className="pb-4 text-center">Frecuencia</th>
                <th className="pb-4 text-center">Tipo de Relación</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((edge, idx) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                // Normalizamos el label a minúsculas para que coincida con las llaves de RELATION_COLORS
                const relationType = (edge.label || "").toLowerCase();
                // Obtenemos el color del archivo de constantes, si no existe usamos un gris por defecto
                const badgeColor = RELATION_COLORS[relationType] || "#4B5563";

                return (
                  <tr key={idx} className="bg-white/5 hover:bg-white/10 transition-colors">
                    <td className="py-4 pl-6 rounded-l-2xl border-l border-y border-white/5">
                      <span className="text-white font-bold text-xs uppercase">
                        {sourceNode?.label || sourceNode?.data?.label || edge.source}
                      </span>
                    </td>
                    <td className="py-4 border-y border-white/5">
                      <span className="text-gray-300 font-bold text-xs uppercase">
                        {targetNode?.label || targetNode?.data?.label || edge.target}
                      </span>
                    </td>
                    <td className="py-4 border-y border-white/5 text-center font-mono text-[#1e90ff]">
                      {getFrecuenciaNormalizada(edge.frecuencia || 1)}
                    </td>
                    <td className="py-4 rounded-r-2xl border-r border-y border-white/5 text-center">
                      <span 
                        className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border"
                        style={{ 
                          backgroundColor: `${badgeColor}20`, // Color con 20% de opacidad para el fondo
                          color: badgeColor,                 // Color sólido para el texto
                          borderColor: `${badgeColor}40`      // Color con 40% de opacidad para el borde
                        }}
                      >
                        {edge.label || "Sin tipo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}