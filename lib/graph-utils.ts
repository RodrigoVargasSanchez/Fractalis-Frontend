import { LAYOUT_CONFIG } from "../app/espacios/grafo/[id]/constants";

/**
 * Calcula las posiciones de los nodos manteniendo la estética original
 * pero compatible con UIDs y la nueva estructura de datos.
 */
export const calculateNodePositions = (processedNodes: any[]) => {
  const calculatedPositions: Record<string, { x: number; y: number }> = {};
  const tempNodes: { id: string; x: number; y: number }[] = [];

  processedNodes.forEach((node, idx) => {
    // 1. Acceso compatible a los datos
    const nodeData = node.data || node.properties || {};
    const rNum = typeof nodeData.ronda === 'number' ? nodeData.ronda : 1;
    
    const phi = (Math.sqrt(5) + 1) / 2;
    const clusterAngle = (rNum - 1) * phi * 2 * Math.PI;
    
    // 2. Lógica matemática ORIGINAL (Sin el multiplicador de rNum)
    let px = Math.cos(clusterAngle) * (rNum === 1 ? 0 : LAYOUT_CONFIG.CLUSTER_STEP);
    let py = Math.sin(clusterAngle) * (rNum === 1 ? 0 : LAYOUT_CONFIG.CLUSTER_STEP);
    
    // 3. Dispersión espiral ORIGINAL
    px += Math.cos(idx * LAYOUT_CONFIG.SPIRAL_FACTOR) * 100;
    py += Math.sin(idx * LAYOUT_CONFIG.SPIRAL_FACTOR) * 100;

    // 4. Algoritmo de anti-colisión ORIGINAL
    for (let iter = 0; iter < 100; iter++) {
      let moved = false;
      tempNodes.forEach((other) => {
        const dx = px - other.x;
        const dy = py - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const minDist = LAYOUT_CONFIG.MIN_DIST; // Usamos el valor directo de tu constante

        if (distance < minDist) {
          const force = (minDist - distance) / (distance || 1);
          px += dx * force * 0.5;
          py += dy * force * 0.5;
          moved = true;
        }
      });
      if (!moved) break;
    }

    // 5. Guardado compatible con UIDs (node.id)
    const nodeId = node.id.toString();
    calculatedPositions[nodeId] = { x: px, y: py };
    tempNodes.push({ id: nodeId, x: px, y: py });
  });

  return calculatedPositions;
};