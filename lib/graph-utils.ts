import { LAYOUT_CONFIG } from "../app/espacios/grafo/[id]/constants";

export const calculateNodePositions = (processedNodes: any[]) => {
  const calculatedPositions: Record<string, { x: number; y: number }> = {};
  const tempNodes: { id: string; x: number; y: number }[] = [];

  processedNodes.forEach((node, idx) => {
    const rNum = node.properties.ronda;
    const phi = (Math.sqrt(5) + 1) / 2;
    const clusterAngle = (rNum - 1) * phi * 2 * Math.PI;
    
    let px = Math.cos(clusterAngle) * (rNum === 1 ? 0 : LAYOUT_CONFIG.CLUSTER_STEP);
    let py = Math.sin(clusterAngle) * (rNum === 1 ? 0 : LAYOUT_CONFIG.CLUSTER_STEP);
    
    px += Math.cos(idx * LAYOUT_CONFIG.SPIRAL_FACTOR) * 100;
    py += Math.sin(idx * LAYOUT_CONFIG.SPIRAL_FACTOR) * 100;

    // Algoritmo de anti-colisión simple
    for (let iter = 0; iter < 100; iter++) {
      let moved = false;
      tempNodes.forEach((other) => {
        const dx = px - other.x;
        const dy = py - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < LAYOUT_CONFIG.MIN_DIST) {
          const force = (LAYOUT_CONFIG.MIN_DIST - distance) / (distance || 1);
          px += dx * force * 0.5;
          py += dy * force * 0.5;
          moved = true;
        }
      });
      if (!moved) break;
    }
    calculatedPositions[node.id.toString()] = { x: px, y: py };
    tempNodes.push({ id: node.id.toString(), x: px, y: py });
  });

  return calculatedPositions;
};