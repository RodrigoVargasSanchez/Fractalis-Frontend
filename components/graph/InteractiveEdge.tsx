"use client";

import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from 'reactflow';

export function InteractiveEdge({
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
}: EdgeProps) {
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

  return (
    <>
      {/* Envolvemos en un grupo G para capturar el click en toda el área de la arista */}
      <g onClick={toggleOpen} style={{ cursor: 'pointer' }}>
        <BaseEdge 
          path={edgePath} 
          markerEnd={markerEnd} 
          style={{ 
            ...style, 
            strokeWidth: isOpen ? 5 : 3.5,
            stroke: edgeColor,
            transition: 'stroke-width 0.2s' 
          }} 
          interactionWidth={25} 
        />
        {/* Arista invisible extra para facilitar el click (hitbox) */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
        />
      </g>
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'none', 
          }}
          className="nodrag nopan flex flex-col items-center"
        >
          {isOpen && (
            <div 
              style={{ pointerEvents: 'all' }} 
              className="bg-[#1a1a1a] border border-white/20 p-3 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200 min-w-[140px]"
            >
              <div className="flex justify-between items-start gap-4 mb-1">
                <p 
                  className="text-[11px] font-bold uppercase tracking-tighter"
                  style={{ color: edgeColor }}
                >
                  {data?.label || "Relación"}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que al cerrar se vuelva a abrir por el click en el grupo G
                    setIsOpen(false);
                  }}
                  className="text-white/40 hover:text-white text-[12px] p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-white/90 leading-tight">
                Aquí está la información detallada de la conexión.
              </p>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}