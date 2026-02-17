import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { RELATION_COLORS } from "@/app/espacios/grafo/[id]/constants";

interface StatsPanelViewProps {
  activeTab: "conceptos" | "relaciones";

  // Para estadísticas de conceptos
  nodes: any[];
  edges: any[];

  // Para estadísticas de relaciones (los que funcionaban antes)
  relationNodes: any[];
  relationEdges: any[];

  totalObservations?: number;
}

interface GroupedEdge {
  sourceId: string;
  targetId: string;
  sourceLabel: string;
  targetLabel: string;
  count: number;
  types: Record<string, number>;
}

export function StatsPanelView({
  activeTab,
  nodes,
  edges,
  relationNodes,
  relationEdges,
  totalObservations = 1
}: StatsPanelViewProps) {

  // 🔥 Selección interna correcta
  const workingNodes = activeTab === "relaciones" ? relationNodes : nodes;
  const workingEdges = activeTab === "relaciones" ? relationEdges : edges;

  const getNodeLabel = (id: string) => {
    const node = workingNodes.find(n => n.id === id);
    return node?.data?.label || node?.label || id;
  };

  const groupedEdges = useMemo<GroupedEdge[]>(() => {
    if (activeTab !== "relaciones") return [];

    const groups: Record<string, GroupedEdge> = {};
    const blacklistedLabels = ['CREATED', 'ABOUT_TOPIC', 'HAS_CONCEPT', 'MADE_OPINION', 'CONTAINS'];

    workingEdges.forEach((edge) => {
      if (blacklistedLabels.includes(edge.label)) return;

      const key = `${edge.source}-${edge.target}`;

      if (!groups[key]) {
        groups[key] = {
          sourceId: edge.source,
          targetId: edge.target,
          sourceLabel: getNodeLabel(edge.source),
          targetLabel: getNodeLabel(edge.target),
          count: 0,
          types: {},
        };
      }

      groups[key].count += 1;
      const label = edge.label || "Sin tipo";
      groups[key].types[label] = (groups[key].types[label] || 0) + 1;
    });

    return Object.values(groups);
  }, [workingEdges, workingNodes, activeTab]);

  const getFrecuenciaNormalizada = (frecuencia: number) => {
    return (frecuencia / (totalObservations || 1)).toFixed(2);
  };

  return (
    <div className="mx-8 my-4 bg-[#0d0d0d] rounded-[40px] border border-white/10 shadow-2xl h-[70vh] overflow-hidden flex flex-col animate-fade-in">
      <div className="flex-1 overflow-auto custom-scrollbar p-8">

        {activeTab === "conceptos" ? (

          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                <th className="pb-4 pl-6">Concepto</th>
                <th className="pb-4">Grado</th>
                <th className="pb-4">Centralidad</th>
                <th className="pb-4">Comunidad</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, idx) => {
                const frecuencia = node.data?.grado || 0;
                const centralidad = node.data?.centralidad || 0;
                const comunidadId = node.data?.comunidad ?? 0;

                return (
                  <tr key={idx} className="bg-white/5 hover:bg-white/10 transition-colors group">
                    <td className="py-4 pl-6 rounded-l-2xl border-l border-y border-white/5">
                      <span className="font-black text-sm uppercase italic group-hover:text-[#1e90ff] transition-colors block max-w-md">
                        {node.data?.label || node.label || node.id}
                      </span>
                    </td>
                    <td className="py-4 border-y border-white/5 font-mono text-[#1e90ff]">
                      {frecuencia}
                      <span className="text-[10px] text-gray-500 ml-2">
                        ({getFrecuenciaNormalizada(frecuencia)})
                      </span>
                    </td>
                    <td className="py-4 border-y border-white/5 font-mono font-bold text-blue-400">
                      {centralidad.toFixed(3)}
                    </td>
                    <td className="py-4 rounded-r-2xl border-r border-y border-white/5 text-gray-500 uppercase text-[10px] font-bold">
                      <span className="bg-white/10 px-2 py-1 rounded">
                        GRUPO {comunidadId}
                      </span>
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
                <th className="pb-4 pl-6">Concepto Origen</th>
                <th className="pb-4">Concepto Destino</th>
                <th className="pb-4 text-center">N° Relaciones</th>
                <th className="pb-4 text-center">Tipos de Relación</th>
              </tr>
            </thead>
            <tbody>
              {groupedEdges.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-gray-500 italic">
                    No hay relaciones semánticas detectadas.
                  </td>
                </tr>
              ) : (
                groupedEdges.map((group, idx) => (
                  <tr key={idx} className="bg-white/5 hover:bg-white/10 transition-colors group">
                    <td className="py-4 pl-6 rounded-l-2xl border-l border-y border-white/5">
                      <span className="text-white font-bold text-[11px] uppercase block max-w-[280px] leading-tight group-hover:text-[#1e90ff] transition-colors">
                        {group.sourceLabel}
                      </span>
                    </td>
                    <td className="py-4 border-y border-white/5">
                      <span className="text-gray-400 font-bold text-[11px] uppercase block max-w-[280px] leading-tight">
                        {group.targetLabel}
                      </span>
                    </td>
                    <td className="py-4 border-y border-white/5 text-center font-mono">
                      <div className="flex flex-col">
                        <span className="text-[#1e90ff] text-base font-black">{group.count}</span>
                        <span className="text-[9px] text-gray-500 opacity-70">
                          f: {getFrecuenciaNormalizada(group.count)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 rounded-r-2xl border-r border-y border-white/5">
                      <div className="flex flex-wrap justify-center gap-2 px-4">
                        {Object.entries(group.types).map(([label, count]) => {
                          const relationType = label.toLowerCase();
                          const color = RELATION_COLORS[relationType] || "#4B5563";
                          return (
                            <span
                              key={label}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black border"
                              style={{
                                backgroundColor: `${color}15`,
                                color: color,
                                borderColor: `${color}40`
                              }}
                            >
                              {label}
                              <span className="bg-white/20 px-1 rounded text-white">
                                {Number(count)}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        )}

      </div>
    </div>
  );
}
