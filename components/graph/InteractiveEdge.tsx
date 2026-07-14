"use client";

import React, { useState, memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from 'reactflow';

type CustomEdgeProps = EdgeProps & {
  className?: string;
};

export const InteractiveEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  className,
  markerEnd,
  data,
}: CustomEdgeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const edgeColor = data?.color || style.stroke || '#b1b1b7';
  const isConsolidated = data?.isConsolidated;
  const totalIntervenciones = (data?.sinergias || 0) + (data?.antagonismos || 0);
  const hasGlow = isConsolidated && totalIntervenciones >= 2;

  const edgeIndex = data?.edgeIndex || 0;
  const curvature = isConsolidated ? 0 : (edgeIndex * 0.4);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: curvature,
  });

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // --- LÓGICA DE ETIQUETA DINÁMICA ---
  const authorsList = data?.authors || [];
  const isColective = authorsList.length > 1;

  const getDynamicLabel = () => {
    // Si es una mezcla de ambos, mantenemos el término Mixto
    if (data?.label?.toLowerCase().includes("mixto")) return "Conflicto";

    // Detectamos si la base es sinergia o antagonismo por el label original
    const isAntagonismo = data?.label?.toLowerCase().includes("antagonismo");
    const baseName = isAntagonismo ? "Antagonismo" : "Sinergia";

    // Si hay más de uno, agregamos "Colectivo", si no, queda el nombre base
    return isColective ? `${baseName} Colectivo (${authorsList.length})` : baseName;
  };

  const displayLabel = isConsolidated ? getDynamicLabel() : (data?.label || "Relación");
  // ----------------------------------

  return (
    <>
      <g onClick={toggleOpen} style={{ cursor: 'pointer' }} className={className}>
        <defs>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {hasGlow && (
          <path
            d={edgePath}
            fill="none"
            stroke={edgeColor}
            strokeWidth={Number(style.strokeWidth || 3.5) + 6}
            opacity={0.2}
            filter={`url(#glow-${id})`}
          />
        )}

        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          interactionWidth={20}
          style={{
            ...style,
            strokeWidth: isOpen ? (Number(style.strokeWidth || 3.5) + 2) : style.strokeWidth,
            stroke: edgeColor,
          }}
        />

        <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
      </g>

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'none',
          }}
          className="nodrag nopan z-50"
        >
          {isOpen && (
            <div
              style={{ pointerEvents: 'all' }}
              className="bg-[#1a1a1a] border border-white/10 p-4 rounded-xl shadow-2xl min-w-[240px]"
            >
              {/* CABECERA */}
              <div className="flex justify-between items-center mb-3">
                <span
                  className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border"
                  style={{ color: edgeColor, borderColor: `${edgeColor}44`, backgroundColor: `${edgeColor}11` }}
                >
                  {displayLabel}
                </span>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-white/30 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* CONTENIDO DINÁMICO */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-white/40 uppercase font-bold tracking-tight">
                  {isColective ? "Intervenciones en este Diálogo:" : "Información de la Relación:"}
                </span>

                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {isConsolidated && data.authors ? (
                    data.authors.map((auth: any, idx: number) => {
                      const isSinergia = auth.type?.toLowerCase().includes('sinergia') || auth.type?.toLowerCase().includes('complementary');
                      const typeColor = isSinergia ? '#2ecc71' : '#e74c3c';

                      return (
                        <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                          <div
                            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                            style={{
                              backgroundColor: `${typeColor}22`,
                              color: typeColor,
                              border: `1px solid ${typeColor}44`
                            }}
                          >
                            {auth.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[11px] text-white/90 truncate font-medium">{auth.name}</span>
                            <span className="text-[8px] uppercase tracking-tighter opacity-50" style={{ color: typeColor }}>
                              {isSinergia ? 'Sinergia' : 'Antagonismo'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                      <div
                        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold"
                        style={{ backgroundColor: `${edgeColor}22`, color: edgeColor, border: `1px solid ${edgeColor}44` }}
                      >
                        {data?.authorName?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[12px] text-white/95 font-semibold truncate">
                          {data?.authorName || "Anónimo"}
                        </span>
                        <span className="text-[9px] text-white/40 italic">Autor Original</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER PARA CONSOLIDADOS */}
              {isConsolidated && (
                <div className="mt-3 pt-2 border-t border-white/5 flex justify-between text-[8px] text-white/30 font-bold uppercase tracking-widest">
                  <span>Sinergias: {data.sinergias}</span>
                  <span>Antagonismos: {data.antagonismos}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

InteractiveEdge.displayName = 'InteractiveEdge';