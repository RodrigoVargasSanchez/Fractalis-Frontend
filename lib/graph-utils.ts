import { LAYOUT_CONFIG } from "../app/espacios/grafo/[id]/constants";

/**
 * Calcula las posiciones de los nodos manteniendo la estética original
 * pero compatible con UIDs y la nueva estructura de datos.
 */
export const calculateNodePositions = (processedNodes: any[]) => {
  const calculatedPositions: Record<string, { x: number; y: number }> = {};
  const tempNodes: { id: string; x: number; y: number }[] = [];

  processedNodes.forEach((node, idx) => {
    const nodeData = node.data || node.properties || {};
    const rNum = typeof nodeData.ronda === 'number' ? nodeData.ronda : 1;

    const phi = (Math.sqrt(5) + 1) / 2;
    const clusterAngle = (rNum - 1) * phi * 2 * Math.PI;

    let px = Math.cos(clusterAngle) * (rNum === 1 ? 0 : LAYOUT_CONFIG.CLUSTER_STEP);
    let py = Math.sin(clusterAngle) * (rNum === 1 ? 0 : LAYOUT_CONFIG.CLUSTER_STEP);

    px += Math.cos(idx * LAYOUT_CONFIG.SPIRAL_FACTOR) * 100;
    py += Math.sin(idx * LAYOUT_CONFIG.SPIRAL_FACTOR) * 100;

    for (let iter = 0; iter < 100; iter++) {
      let moved = false;
      tempNodes.forEach((other) => {
        const dx = px - other.x;
        const dy = py - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const minDist = LAYOUT_CONFIG.MIN_DIST;

        if (distance < minDist) {
          const force = (minDist - distance) / (distance || 1);
          px += dx * force * 0.5;
          py += dy * force * 0.5;
          moved = true;
        }
      });
      if (!moved) break;
    }

    const nodeId = node.id.toString();
    calculatedPositions[nodeId] = { x: px, y: py };
    tempNodes.push({ id: nodeId, x: px, y: py });
  });

  return calculatedPositions;
};

export interface GraphMetrics {
  degrees: Record<string, number>;
  betweenness: Record<string, number>;
  communities: Record<string, number>;
}

export function calculateGraphMetrics(nodes: any[], edges: any[]): GraphMetrics {
  const nodeIds = nodes.map(n => n.id.toString());
  const edgeList = edges.filter(e => {
    const sourceStr = e.source?.toString();
    const targetStr = e.target?.toString();
    return nodeIds.includes(sourceStr) && nodeIds.includes(targetStr);
  });

  const degrees: Record<string, number> = {};
  nodeIds.forEach(id => {
    degrees[id] = 0;
  });

  edgeList.forEach(e => {
    const s = e.source.toString();
    const t = e.target.toString();
    if (degrees[s] !== undefined) degrees[s]++;
    if (degrees[t] !== undefined) degrees[t]++;
  });

  const betweenness: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  nodeIds.forEach(id => {
    betweenness[id] = 0;
    adj[id] = [];
  });

  edgeList.forEach(e => {
    const u = e.source.toString();
    const v = e.target.toString();
    if (adj[u] && adj[v]) {
      if (!adj[u].includes(v)) adj[u].push(v);
      if (!adj[v].includes(u)) adj[v].push(u);
    }
  });

  nodeIds.forEach(s => {
    const S: string[] = [];
    const P: Record<string, string[]> = {};
    const sigma: Record<string, number> = {};
    const d: Record<string, number> = {};

    nodeIds.forEach(w => {
      P[w] = [];
      sigma[w] = 0;
      d[w] = -1;
    });

    sigma[s] = 1;
    d[s] = 0;

    const Q: string[] = [s];

    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);
      adj[v].forEach(w => {
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      });
    }

    const delta: Record<string, number> = {};
    nodeIds.forEach(w => {
      delta[w] = 0;
    });

    while (S.length > 0) {
      const w = S.pop()!;
      P[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== s) {
        betweenness[w] += delta[w];
      }
    }
  });

  nodeIds.forEach(id => {
    betweenness[id] = betweenness[id] / 2;
  });

  const n = nodeIds.length;
  const factor = n > 2 ? ((n - 1) * (n - 2)) / 2 : 1;
  nodeIds.forEach(id => {
    betweenness[id] = betweenness[id] / factor;
  });

  const communities: Record<string, number> = {};
  nodeIds.forEach((id, idx) => {
    communities[id] = idx;
  });

  let changed = true;
  let iter = 0;
  const maxIter = 15;

  while (changed && iter < maxIter) {
    changed = false;
    iter++;

    const shuffledIds = [...nodeIds].sort(() => Math.random() - 0.5);

    shuffledIds.forEach(u => {
      const neighbors = adj[u];
      if (!neighbors || neighbors.length === 0) return;

      const labelCounts: Record<number, number> = {};
      neighbors.forEach(v => {
        const label = communities[v];
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });

      let maxCount = -1;
      let bestLabels: number[] = [];
      for (const [labelStr, count] of Object.entries(labelCounts)) {
        const label = parseInt(labelStr);
        if (count > maxCount) {
          maxCount = count;
          bestLabels = [label];
        } else if (count === maxCount) {
          bestLabels.push(label);
        }
      }

      const currentLabel = communities[u];
      if (bestLabels.length > 0 && !bestLabels.includes(currentLabel)) {
        const newLabel = bestLabels[Math.floor(Math.random() * bestLabels.length)];
        communities[u] = newLabel;
        changed = true;
      }
    });
  }

  const uniqueLabels = Array.from(new Set(Object.values(communities))).sort((a, b) => a - b);
  const labelMap: Record<number, number> = {};
  uniqueLabels.forEach((label, idx) => {
    labelMap[label] = idx;
  });

  const normalizedCommunities: Record<string, number> = {};
  nodeIds.forEach(id => {
    normalizedCommunities[id] = labelMap[communities[id]] ?? 0;
  });

  return { degrees, betweenness, communities: normalizedCommunities };
}

/**
 * Calcula una distribución de Fuerza Dirigida (Force-Directed) orgánica para los nodos
 */
export const calculateForceDirectedLayout = (nodes: any[], edges: any[]) => {
  const calculatedPositions: Record<string, { x: number; y: number }> = {};
  const width = 1000;
  const height = 800;

  const tempNodes = nodes.map((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI;
    return {
      id: n.id.toString(),
      x: Math.cos(angle) * 300 + width / 2,
      y: Math.sin(angle) * 300 + height / 2,
      fx: 0,
      fy: 0
    };
  });

  const nodeMap = new Map(tempNodes.map(n => [n.id, n]));
  const k = 150;
  const iterations = 80;
  const repForce = 15000;
  const attrForce = 0.08;
  const gravity = 0.04;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < tempNodes.length; i++) {
      const u = tempNodes[i];
      for (let j = i + 1; j < tempNodes.length; j++) {
        const v = tempNodes[j];
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 500) {
          const force = repForce / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          u.fx -= fx;
          u.fy -= fy;
          v.fx += fx;
          v.fy += fy;
        }
      }
    }

    edges.forEach(e => {
      const sId = e.source.toString();
      const tId = e.target.toString();
      const u = nodeMap.get(sId);
      const v = nodeMap.get(tId);
      if (u && v) {
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = attrForce * (dist - k);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        u.fx += fx;
        u.fy += fy;
        v.fx -= fx;
        v.fy -= fy;
      }
    });

    tempNodes.forEach(u => {
      const dx = width / 2 - u.x;
      const dy = height / 2 - u.y;
      u.fx += dx * gravity;
      u.fy += dy * gravity;

      u.x += u.fx;
      u.y += u.fy;

      u.fx = 0;
      u.fy = 0;
    });
  }

  tempNodes.forEach(u => {
    calculatedPositions[u.id] = { x: u.x - width / 2, y: u.y - height / 2 };
  });

  return calculatedPositions;
};

/**
 * Calcula una distribución Circular por Grupos (Comunidades)
 */
export const calculateCircularCommunityLayout = (nodes: any[]) => {
  const calculatedPositions: Record<string, { x: number; y: number }> = {};
  const communityGroups: Record<number, any[]> = {};

  nodes.forEach(node => {
    const com = node.data?.comunidad ?? 0;
    if (!communityGroups[com]) communityGroups[com] = [];
    communityGroups[com].push(node);
  });

  const communities = Object.keys(communityGroups).map(Number);
  const numCommunities = communities.length;

  communities.forEach((com, cIdx) => {
    const comAngle = (cIdx / numCommunities) * 2 * Math.PI;
    const comRadius = numCommunities > 1 ? 280 : 0;
    const cx = Math.cos(comAngle) * comRadius;
    const cy = Math.sin(comAngle) * comRadius;

    const groupNodes = communityGroups[com] || [];
    const groupSize = groupNodes.length;

    groupNodes.forEach((node, nIdx) => {
      const nodeAngle = (nIdx / groupSize) * 2 * Math.PI;
      const nodeRadius = groupSize > 1 ? 90 : 0;
      const px = cx + Math.cos(nodeAngle) * nodeRadius;
      const py = cy + Math.sin(nodeAngle) * nodeRadius;

      calculatedPositions[node.id.toString()] = { x: px, y: py };
    });
  });

  return calculatedPositions;
};