// hooks/useGraphEdges.ts
import { useMemo } from 'react';
import { Edge, MarkerType } from 'reactflow';
import { getEdgeColor, shouldVisibleEdge } from '@/lib/edge-utils';

export function useGraphEdges(
  masterEdges: any[],
  visibleNodeIds: Set<string>,
  relationFilter: string,
  isPlaying: boolean,
  showEdges: boolean,
  currentStepId?: string,
  animatedEdgesSet?: Set<string>
) {
  return useMemo(() => {
    return masterEdges
      .filter((e) => shouldVisibleEdge(e, visibleNodeIds, relationFilter))
      .map((edge) => {
        const edgeId = `e-${edge.id}`;
        const color = getEdgeColor(edge.label || edge.type);
        const hasBeenAnimated = animatedEdgesSet?.has(edgeId);

        let source = edge.source.toString();
        let target = edge.target.toString();

        // Lógica de inversión de dirección durante el playback
        if (isPlaying && currentStepId && (source === currentStepId || target === currentStepId)) {
          if (target === currentStepId) {
            [source, target] = [target, source]; // Destructuring swap
          }
          if (showEdges) animatedEdgesSet?.add(edgeId);
        }

        // Si estamos en playback y no se deben mostrar/animar aún
        if (isPlaying && !showEdges && !hasBeenAnimated) return null;

        return {
          id: edgeId,
          source,
          target,
          type: "simplebezier",
          className: hasBeenAnimated ? "edge-static" : "growing-edge",
          style: { stroke: color, strokeWidth: 3.5, opacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color },
        };
      }).filter(Boolean) as Edge[];
  }, [masterEdges, visibleNodeIds, relationFilter, isPlaying, showEdges, currentStepId]);
}