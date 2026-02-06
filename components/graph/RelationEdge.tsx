import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

// Definimos la interfaz para la data personalizada que pasamos en useGraphLogic
interface RelationEdgeData {
  author: string;
  type: string;
  onEdgeClick: (info: { author: string; type: string; color: string }) => void;
}

export function RelationEdge({
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
  // Desestructuramos las props que React Flow inyecta internamente
  ...rest 
}: EdgeProps<RelationEdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  // Accedemos a className de forma segura desde las props internas de React Flow
  const className = (rest as any).className || "";

  const onAction = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (data?.onEdgeClick) {
      data.onEdgeClick({
        author: data.author,
        type: data.type,
        color: style.stroke as string || "#ffffff"
      });
    }
  };

  return (
    <>
      {/* Path invisible más ancho para facilitar la interacción */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="cursor-pointer"
        onClick={onAction}
      />
      {/* Path visual con tus animaciones existentes */}
      <path
        id={id}
        style={style}
        className={`react-flow__edge-path cursor-pointer transition-all hover:stroke-[6px] ${className}`}
        d={edgePath}
        markerEnd={markerEnd}
        onClick={onAction}
      />
    </>
  );
}