"use client";

import React, { useState, memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from 'reactflow';

// Usamos memo para evitar que la arista se re-renderice si sus props no cambian
export const InteractiveEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const edgeColor = style.stroke || '#b1b1b7';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const authorInitial = data?.authorName?.charAt(0).toUpperCase() || "?";

  return (
    <>
      <g onClick={toggleOpen} style={{ cursor: 'pointer' }}>
        <BaseEdge 
          path={edgePath} 
          markerEnd={markerEnd} 
          style={{ 
            ...style, 
            strokeWidth: isOpen ? 5 : 3.5,
            stroke: edgeColor,
            // OPTIMIZACIÓN: Solo animamos el grosor, NO el movimiento
            transition: 'stroke-width 0.2s ease',
          }} 
          interactionWidth={25} 
        />
        {/* Hitbox para facilitar el click */}
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
              // OPTIMIZACIÓN: Quitamos backdrop-blur y usamos un color sólido u opaco
              // Quitamos animaciones complejas de entrada
              className="bg-[#1a1a1a] border border-white/10 p-3 rounded-xl shadow-2xl min-w-[180px]"
            >
              <div className="flex justify-between items-center mb-3">
                <span 
                  className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border"
                  style={{ 
                    color: edgeColor, 
                    borderColor: `${edgeColor}44`,
                    backgroundColor: `${edgeColor}11` 
                  }}
                >
                  {data?.label || "Relación"}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ backgroundColor: `${edgeColor}33`, color: edgeColor, border: `1px solid ${edgeColor}44` }}
                >
                  {authorInitial}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-tight">Propuesto por</span>
                  <span className="text-[12px] text-white/95 font-semibold leading-none truncate max-w-[110px]">
                    {data?.authorName || "Anónimo"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

InteractiveEdge.displayName = 'InteractiveEdge';