"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { RELATION_COLORS, COMMUNITY_COLORS } from "@/app/espacios/grafo/[id]/constants";

interface StatsPanelViewProps {
  activeTab: "conceptos" | "relaciones";

  // Para estadísticas de conceptos
  nodes: any[];
  edges: any[];

  // Para estadísticas de relaciones (los que funcionaban antes)
  relationNodes: any[];
  relationEdges: any[];

  totalObservations?: number;
  isCommunityLayoutOn?: boolean;
  setIsCommunityLayoutOn?: (v: boolean) => void;
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
  totalObservations = 1,
  isCommunityLayoutOn = false,
  setIsCommunityLayoutOn
}: StatsPanelViewProps) {

  // --- Selección interna de elementos según la pestaña ---
  const workingNodes = activeTab === "relaciones" ? relationNodes : nodes;
  const workingEdges = activeTab === "relaciones" ? relationEdges : edges;

  const getNodeLabel = (id: string) => {
    const node = workingNodes.find(n => n.id === id);
    return node?.data?.label || node?.label || id;
  };

  // --- CÁLCULO DE MÉTRICAS ESTRUCTURALES LOCALES (Pestaña Conceptos) ---

  // 1. Agrupamiento y Distribución de Comunidades
  const communitiesGroup = useMemo(() => {
    if (nodes.length === 0) return [];
    
    const groups: Record<number, any[]> = {};
    nodes.forEach(node => {
      const comId = node.data?.comunidad ?? 0;
      if (!groups[comId]) groups[comId] = [];
      groups[comId].push(node);
    });

    return Object.entries(groups)
      .map(([id, members]) => ({
        id: parseInt(id),
        members,
        percentage: (members.length / nodes.length) * 100
      }))
      .sort((a, b) => b.members.length - a.members.length);
  }, [nodes]);

  // 2. Top 5 Centralidad de Grado (Ideas que acaparan el debate)
  const topDegreeNodes = useMemo(() => {
    return [...nodes]
      .sort((a, b) => (b.data?.grado || 0) - (a.data?.grado || 0))
      .slice(0, 5);
  }, [nodes]);

  // 3. Top 5 Centralidad de Intermediación (Brandes) (Nodos reguladores / Puentes)
  const topBetweennessNodes = useMemo(() => {
    return [...nodes]
      .sort((a, b) => (b.data?.centralidad || 0) - (a.data?.centralidad || 0))
      .slice(0, 5);
  }, [nodes]);

  // 4. Asignación Dinámica de Etiquetas de Rol
  const getRoles = (nodeId: string) => {
    const roles = [];
    const isTopDegree = topDegreeNodes.slice(0, 3).some(n => n.id === nodeId && (n.data?.grado || 0) > 0);
    const isTopBetweenness = topBetweennessNodes.slice(0, 3).some(n => n.id === nodeId && (n.data?.centralidad || 0) > 0);

    if (isTopDegree) {
      roles.push({
        name: "Detonante / Imán",
        color: "bg-pink-500/10 text-pink-400 border-pink-500/20"
      });
    }
    if (isTopBetweenness) {
      roles.push({
        name: "Puente Discursivo",
        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      });
    }
    return roles;
  };

  // --- PROCESAMIENTO DE RELACIONES (Pestaña Relaciones) ---
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
    <div className="mx-8 mb-6 bg-[#0d0d0d] rounded-[40px] border border-white/10 shadow-2xl flex-1 min-h-0 overflow-hidden flex flex-col animate-fade-in">
      <div className="flex-1 overflow-auto custom-scrollbar p-8">

        {activeTab === "conceptos" ? (
          
          <div className="grid lg:grid-cols-12 gap-8">
            {/* COLUMNA IZQUIERDA: MÉTRICAS Y RANKINGS (8 COLS) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Tarjetas de Métricas Generales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#151515] p-5 rounded-2xl border border-white/5 flex flex-col justify-between shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">// Total Conceptos</span>
                  <span className="text-3xl font-black text-[#1e90ff] mt-2">{nodes.length}</span>
                  <p className="text-[10px] text-gray-400 mt-1">Nodos semánticos activos</p>
                </div>
                <div className="bg-[#151515] p-5 rounded-2xl border border-white/5 flex flex-col justify-between shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">// Relaciones en Vista</span>
                  <span className="text-3xl font-black text-[#2ed573] mt-2">{edges.length}</span>
                  <p className="text-[10px] text-gray-400 mt-1">Aristas semánticas trazadas</p>
                </div>
              </div>

              {/* Top 5 Centralidad de Grado (Barras de Progreso) */}
              <div className="bg-[#151515] p-6 rounded-3xl border border-white/5 space-y-4 shadow-xl">
                <h3 className="text-sm font-mono uppercase tracking-wider text-white border-b border-white/5 pb-2">
                  Top 5 Centralidad de Grado (Volumen de Conexiones)
                </h3>
                <div className="space-y-4">
                  {topDegreeNodes.length === 0 ? (
                    <p className="text-xs text-gray-500 italic uppercase">// No hay nodos suficientes.</p>
                  ) : (
                    topDegreeNodes.map((node, index) => {
                      const degreeVal = node.data?.grado || 0;
                      const maxDegree = topDegreeNodes[0]?.data?.grado || 1;
                      const percentage = maxDegree > 0 ? (degreeVal / maxDegree) * 100 : 0;
                      const comId = node.data?.comunidad ?? 0;
                      const comColor = COMMUNITY_COLORS[comId % COMMUNITY_COLORS.length];
                      const nodeColor = node.data?.color || "#1e90ff";

                      return (
                        <div key={node.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white uppercase italic truncate max-w-xs sm:max-w-md">
                              {index + 1}. {node.data?.label || node.id}
                            </span>
                            <span className="font-mono text-gray-400">
                              {degreeVal} conex.
                            </span>
                          </div>
                          <div className="relative w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: nodeColor,
                                boxShadow: `0 0 10px ${nodeColor}50`
                              }}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <span 
                              className="text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border"
                              style={{ backgroundColor: `${comColor}15`, color: comColor, borderColor: `${comColor}30` }}
                            >
                              Grupo {comId}
                            </span>
                            {getRoles(node.id).map(r => (
                              <span key={r.name} className={cn("text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border", r.color)}>
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top 5 Centralidad de Intermediación (Puentes de Diálogo) */}
              <div className="bg-[#151515] p-6 rounded-3xl border border-white/5 space-y-4 shadow-xl">
                <h3 className="text-sm font-mono uppercase tracking-wider text-white border-b border-white/5 pb-2">
                  Top 5 Centralidad de Intermediación (Puentes Reguladores)
                </h3>
                <div className="space-y-4">
                  {topBetweennessNodes.length === 0 ? (
                    <p className="text-xs text-gray-500 italic uppercase">// No hay nodos suficientes.</p>
                  ) : (
                    topBetweennessNodes.map((node, index) => {
                      const betweennessVal = node.data?.centralidad || 0;
                      const maxBetweenness = topBetweennessNodes[0]?.data?.centralidad || 1;
                      const percentage = maxBetweenness > 0 ? (betweennessVal / maxBetweenness) * 100 : 0;
                      const comId = node.data?.comunidad ?? 0;
                      const comColor = COMMUNITY_COLORS[comId % COMMUNITY_COLORS.length];
                      const nodeColor = node.data?.color || "#22c55e";

                      return (
                        <div key={node.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white uppercase italic truncate max-w-xs sm:max-w-md">
                              {index + 1}. {node.data?.label || node.id}
                            </span>
                            <span className="font-mono text-cyan-400 font-bold">
                              {betweennessVal.toFixed(3)}
                            </span>
                          </div>
                          <div className="relative w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: nodeColor,
                                boxShadow: `0 0 10px ${nodeColor}50`
                              }}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <span 
                              className="text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border"
                              style={{ backgroundColor: `${comColor}15`, color: comColor, borderColor: `${comColor}30` }}
                            >
                              Grupo {comId}
                            </span>
                            {getRoles(node.id).map(r => (
                              <span key={r.name} className={cn("text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border", r.color)}>
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: DISTRIBUCIÓN DE COMUNIDADES (4 COLS) */}
            <div className="lg:col-span-4 bg-[#151515] p-6 rounded-3xl border border-white/5 flex flex-col space-y-6 shadow-xl h-fit">
              <div className="flex flex-col gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-white">
                    Distribución de Comunidades
                  </h3>
                  <p className="text-[9px] text-gray-500 uppercase font-mono tracking-wider mt-1">
                    // Clústeres de Afinidad LPA
                  </p>
                </div>
              </div>

              {/* Barra de Distribución Acumulativa */}
              <div className="flex w-full h-4 rounded-full overflow-hidden bg-white/5 shadow-inner">
                {communitiesGroup.map(group => {
                  const color = COMMUNITY_COLORS[group.id % COMMUNITY_COLORS.length];
                  return (
                    <div 
                      key={group.id}
                      style={{ 
                        width: `${group.percentage}%`,
                        backgroundColor: color 
                      }}
                      title={`Grupo ${group.id}: ${group.percentage.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Lista Detallada de Comunidades */}
              <div className="space-y-6 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {communitiesGroup.length === 0 ? (
                  <p className="text-xs text-gray-500 italic uppercase">// No hay agrupaciones.</p>
                ) : (
                  communitiesGroup.map(group => {
                    const color = COMMUNITY_COLORS[group.id % COMMUNITY_COLORS.length];
                    return (
                      <div key={group.id} className="space-y-2 border-b border-white/5 pb-4 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-xs font-mono font-bold text-white">Grupo {group.id}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-400 font-bold">{group.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.members.map(member => {
                            const authorColor = member.data?.color || "#57606f";
                            return (
                              <span 
                                key={member.id}
                                className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-white/80 border border-white/5 hover:border-white/10 hover:text-white transition-colors flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: authorColor }} />
                                {member.data?.label || member.id}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

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
