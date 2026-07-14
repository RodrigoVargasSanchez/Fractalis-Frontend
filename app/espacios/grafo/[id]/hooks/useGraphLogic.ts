"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNodesState, useEdgesState, useReactFlow, Node, Edge, MarkerType } from "reactflow";
import { calculateNodePositions, calculateGraphMetrics, calculateCircularCommunityLayout } from "@/lib/graph-utils";
import { grafoService } from "@/services/grafoService";
import { RELATION_COLORS } from "../constants";

interface MasterData {
  nodes: any[];
  edges: any[];
  personColors: Record<string, string>;
}

const getEdgeColor = (type: string): string => {
  const key = type.toLowerCase();
  if (key === "contradicts" || key === "antagonismo") return RELATION_COLORS.antagonismo;
  if (key === "complementary_to" || key === "sinergia") return RELATION_COLORS.sinergia;
  return RELATION_COLORS[key] || "#ffffff";
};

export function useGraphLogic(graphId: string) {
  const { fitView, setCenter } = useReactFlow();

  const [graphTitle, setGraphTitle] = useState("Cargando...");
  const [masterData, setMasterData] = useState<MasterData>({ nodes: [], edges: [], personColors: {} });
  const [movieSequence, setMovieSequence] = useState<any[]>([]);
  const [rondaActual, setRondaActual] = useState(0);
  const [maxRondas, setMaxRondas] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [velocidad, setVelocidad] = useState(3);
  const [nodoActualIdx, setNodoActualIdx] = useState(-1);
  const [showEdges, setShowEdges] = useState(true);
  const [relationFilter, setRelationFilter] = useState<"polaridad" | "otros" | "todos">("todos");
  const [advancedStats, setAdvancedStats] = useState<any[]>([]);

  // ESTADOS DE INTERACCIÓN Y FILTRADO (PERSONA/RELACIONES)
  const [isMerged, setIsMerged] = useState(false);
  const [spacesMetadata, setSpacesMetadata] = useState<any[] | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [relationTypeFilter, setRelationTypeFilter] = useState<string[]>([
    "sinergia", "antagonismo", "causalidad", "dependencia", "consecuencia", "ejemplificacion"
  ]);

  const [isCommunityLayoutOn, setIsCommunityLayoutOn] = useState(false);

  const defaultPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const communityPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const fixedPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const animatedEdgesRef = useRef<Set<string>>(new Set());

  const refreshGraph = useCallback(async () => {
    try {
      const data = await grafoService.getGraphData(graphId);
      console.log("🔍 [DATA ORIGINAL DEL SERVICIO]:", data);
      console.log(data);

      const metrics = calculateGraphMetrics(data.processedNodes, data.rawEdges);

      const localStats = data.processedNodes.map((node: any) => {
        const nodeIdStr = node.id.toString();
        return {
          id: nodeIdStr,
          name: node.data?.name || node.data?.label || node.label,
          grado: metrics.degrees[nodeIdStr] || 0,
          comunidad: metrics.communities[nodeIdStr] ?? 0,
          centralidad: metrics.betweenness[nodeIdStr] || 0,
        };
      });
      setAdvancedStats(localStats);

      setGraphTitle(data.title);
      setMovieSequence(data.roadmap);
      setIsMerged(!!data.isMerged);
      setSpacesMetadata(data.spacesMetadata || null);

      // Calcular layouts iniciales
      const defaultLayout = calculateNodePositions(data.processedNodes);
      const communityLayout = calculateCircularCommunityLayout(data.processedNodes);

      // Intentar cargar posiciones guardadas en el localStorage para este espacio
      let customPositions: Record<string, { x: number; y: number }> = {};
      try {
        const savedPositionsStr = localStorage.getItem(`fractalis-positions-${graphId}`);
        if (savedPositionsStr) {
          customPositions = JSON.parse(savedPositionsStr);
        }
      } catch (e) {
        console.error("Error loading positions from localStorage", e);
      }

      // Inicializar las referencias de posición
      defaultPositionsRef.current = { ...defaultLayout, ...customPositions };
      communityPositionsRef.current = communityLayout;
      fixedPositionsRef.current = { ...defaultLayout, ...customPositions };

      setMasterData({ nodes: data.processedNodes, edges: data.rawEdges, personColors: data.peopleMap });

      const rondasNodos = data.processedNodes.map((n: any) => n.data?.ronda || 0);
      const rondasRoadmap = data.roadmap.map((r: any) => r.ronda || 0);
      const maxFound = Math.max(...rondasNodos, ...rondasRoadmap, 1);

      setMaxRondas(maxFound);
      setRondaActual((prev) => (prev === 0 ? maxFound : prev));
    } catch (error) {
      console.error("Error al cargar el grafo:", error);
    }
  }, [graphId]);

  useEffect(() => {
    refreshGraph();
  }, [refreshGraph]);

  const handleSetRondaActual = (ronda: number) => {
    setRondaActual(ronda);
    animatedEdgesRef.current.clear();
    if (!isPlaying) {
      const firstNodeIdx = movieSequence.findIndex((s) => s.ronda === ronda);
      setNodoActualIdx(firstNodeIdx !== -1 ? firstNodeIdx - 1 : -1);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isPlaying && nodoActualIdx < movieSequence.length - 1) {
      timer = setTimeout(() => {
        const nextIdx = nodoActualIdx + 1;
        setShowEdges(false);
        setNodoActualIdx(nextIdx);
        const currentRondaInMovie = movieSequence[nextIdx]?.ronda;
        if (currentRondaInMovie) setRondaActual(currentRondaInMovie);
      }, velocidad * 1000 + 1500);
    } else if (nodoActualIdx >= movieSequence.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, nodoActualIdx, movieSequence, velocidad]);

  useEffect(() => {
    if (isPlaying && nodoActualIdx >= 0) {
      const step = movieSequence[nodoActualIdx];
      const pos = fixedPositionsRef.current[step?.id.toString()];
      if (pos) {
        setCenter(pos.x, pos.y, { zoom: 2.2, duration: 800 });
        const timerOut = setTimeout(() => {
          fitView({ duration: 1000, padding: 0.2 });
          const edgeActivationTimer = setTimeout(() => setShowEdges(true), 1000);
          return () => clearTimeout(edgeActivationTimer);
        }, velocidad * 1000 * 0.8);
        return () => clearTimeout(timerOut);
      }
    }
  }, [nodoActualIdx, isPlaying, setCenter, fitView, velocidad, movieSequence]);

  useEffect(() => {
    if (masterData.nodes.length === 0) return;

    const currentStep = movieSequence[nodoActualIdx];
    const currentStepIdStr = currentStep?.id?.toString();

    // Función auxiliar para determinar si un nodo está conectado al nodo activo
    const isNodeConnected = (nodeIdStr: string, activeNodeId: string) => {
      return masterData.edges.some(edge => {
        const s = edge.source.toString();
        const t = edge.target.toString();
        const typeKey = (edge.label || edge.type || "").toLowerCase();
        let normalizedType = typeKey;
        if (typeKey === "complementary_to") normalizedType = "sinergia";
        if (typeKey === "contradicts") normalizedType = "antagonismo";

        // Solo cuenta conexión si el tipo de relación está activo (si no está reproduciendo)
        if (!isPlaying && !relationTypeFilter.includes(normalizedType)) return false;

        return (s === nodeIdStr && t === activeNodeId) || (t === nodeIdStr && s === activeNodeId);
      });
    };

    // 1. PROCESAMIENTO DE NODOS
    const currentNodes: Node[] = masterData.nodes
      .filter((node) => {
        const nodeIdStr = node.id.toString();

        // FILTRO POR PERSONA (PARTICIPANTE) - Solo se aplica si NO está en reproducción
        if (selectedPerson && !isPlaying) {
          const nodeData = node.data || {};
          const autores = nodeData.autoresMenciones || [];
          if (!autores.includes(selectedPerson)) return false;
        }

        const stepInMovie = movieSequence.find(s => s.id.toString() === nodeIdStr);
        const rondaNacimiento = node.data?.ronda || stepInMovie?.ronda || 1;

        if (isPlaying) {
          const visibleIdsInSequence = new Set(movieSequence.slice(0, nodoActualIdx + 1).map((step) => step.id.toString()));
          return visibleIdsInSequence.has(nodeIdStr);
        }
        return rondaNacimiento <= rondaActual;
      })
      .map((node) => {
        const nodeIdStr = node.id.toString();
        const nodeData = node.data || {};
        const isFocused = isPlaying && nodeIdStr === currentStepIdStr;

        const stat = advancedStats.find(s => s.id === nodeIdStr);

        const stepInMovie = movieSequence.find(s => s.id.toString() === nodeIdStr);
        const rondaDeAparicion = nodeData.ronda || stepInMovie?.ronda || 1;

        const mencionesHastaAhora = movieSequence.filter((s) => {
          const isSameNode = s.id.toString() === nodeIdStr;
          return isPlaying
            ? (isSameNode && movieSequence.indexOf(s) <= nodoActualIdx)
            : (isSameNode && s.ronda <= rondaActual);
        });

        const coloresActivos = mencionesHastaAhora.length > 0
          ? mencionesHastaAhora.map((s) => s.authorColor)
          : (nodeData.coloresMenciones || [nodeData.color || "#57606f"]);

        // LÓGICA DE TRANSPARENCIA Y ENFOQUE AL HACER CLICK / HOVER - Solo si NO está en reproducción
        let opacity = 1.0;
        if (!isPlaying && selectedNodeId) {
          const isSelected = nodeIdStr === selectedNodeId;
          const isConnected = isNodeConnected(nodeIdStr, selectedNodeId);
          opacity = (isSelected || isConnected) ? 1.0 : 0.15;
        } else if (!isPlaying && hoveredNodeId) {
          const isHovered = nodeIdStr === hoveredNodeId;
          const isConnected = isNodeConnected(nodeIdStr, hoveredNodeId);
          opacity = (isHovered || isConnected) ? 1.0 : 0.4;
        }

        return {
          id: nodeIdStr,
          type: "circle",
          data: {
            ...nodeData,
            label: nodeData.name || nodeData.label,
            ronda: rondaDeAparicion,
            isFocused,
            mencionesCount: coloresActivos.length,
            coloresMenciones: coloresActivos,
            scale: 1 + (coloresActivos.length - 1) * 0.2,

            grado: stat?.grado || 0,
            centralidad: stat?.centralidad || 0,
            comunidad: stat?.comunidad ?? 0,

            // Atributos de interacción inyectados
            opacity,
            isSelected: nodeIdStr === selectedNodeId
          },
          zIndex: isFocused ? 1000 : (nodeIdStr === selectedNodeId ? 900 : 10 + coloresActivos.length),
          position: fixedPositionsRef.current[nodeIdStr] || { x: 0, y: 0 },
        };
      });

    const currentVisibleIds = new Set(currentNodes.map((n) => n.id));

    // 2. PROCESAMIENTO DE ARISTAS
    const consolidatedMap: Record<string, any> = {};
    const otherEdges: Edge[] = [];
    const pairCount: Record<string, number> = {};

    masterData.edges.forEach((edge) => {
      const sourceId = edge.source.toString();
      const targetId = edge.target.toString();

      if (!currentVisibleIds.has(sourceId) || !currentVisibleIds.has(targetId)) return;

      const typeKey = (edge.label || edge.type || "").toLowerCase();

      // Normalizar tipo de relación
      let normalizedType = typeKey;
      if (typeKey === "complementary_to") normalizedType = "sinergia";
      if (typeKey === "contradicts") normalizedType = "antagonismo";

      // Aplicar filtros por tipo específico de relación - Solo si NO está en reproducción
      if (!isPlaying && !relationTypeFilter.includes(normalizedType)) return;

      const isPolaridad = ["sinergia", "antagonismo"].includes(normalizedType);
      if (!isPlaying && relationFilter === "polaridad" && !isPolaridad) return;
      if (!isPlaying && relationFilter === "otros" && isPolaridad) return;

      const edgeId = `e-${edge.id}`;

      // Lógica de Atenuación de Relación - Solo si NO está en reproducción
      let edgeOpacity = 0.8;
      if (!isPlaying && selectedNodeId) {
        edgeOpacity = (sourceId === selectedNodeId || targetId === selectedNodeId) ? 0.8 : 0.08;
      } else if (!isPlaying && hoveredNodeId) {
        edgeOpacity = (sourceId === hoveredNodeId || targetId === hoveredNodeId) ? 0.8 : 0.2;
      }

      if (isPolaridad) {
        const pairKey = [sourceId, targetId].sort().join("-");
        const consolidatedId = `e-consolidated-${pairKey}`;

        if (isPlaying && !showEdges && !animatedEdgesRef.current.has(edgeId)) return;

        if (!consolidatedMap[pairKey]) {
          consolidatedMap[pairKey] = {
            id: consolidatedId,
            source: sourceId,
            target: targetId,
            type: "interactive",
            data: {
              label: "Relación de Polaridad",
              sinergias: 0,
              antagonismos: 0,
              authors: [],
              isConsolidated: true,
              edgeIndex: 0,
              lastEdgeId: edgeId
            }
          };
        }

        const isPositiva = normalizedType === "sinergia";
        if (isPositiva) consolidatedMap[pairKey].data.sinergias++;
        else consolidatedMap[pairKey].data.antagonismos++;

        consolidatedMap[pairKey].data.authors.push({
          name: edge.data?.author_name || edge.author_name || "Anónimo",
          type: typeKey
        });

        const isConnected = isPlaying && currentStepIdStr && (sourceId === currentStepIdStr || targetId === currentStepIdStr);
        if (isConnected && !animatedEdgesRef.current.has(edgeId) && showEdges) {
          setTimeout(() => {
            animatedEdgesRef.current.add(edgeId);
          }, 100);
        }
      } else {
        const hasBeenAnimated = animatedEdgesRef.current.has(edgeId);
        if (isPlaying && !showEdges && !hasBeenAnimated) return;

        const pairKeyNormal = [sourceId, targetId].sort().join("-");
        pairCount[pairKeyNormal] = (pairCount[pairKeyNormal] || 0) + 1;

        const staggeredIndex = (pairCount[pairKeyNormal] % 2 === 0 ? 1 : -1) * Math.ceil(pairCount[pairKeyNormal] / 2);

        const color = getEdgeColor(typeKey);
        const isConnected = isPlaying && currentStepIdStr && (sourceId === currentStepIdStr || targetId === currentStepIdStr);
        const shouldReverse = isPlaying && targetId === currentStepIdStr;

        if (isConnected && !hasBeenAnimated && showEdges) {
          setTimeout(() => {
            animatedEdgesRef.current.add(edgeId);
          }, 50);
        }

        const animationClass = (isConnected && !hasBeenAnimated && showEdges)
          ? (shouldReverse ? "growing-edge reverse" : "growing-edge")
          : "edge-static";

        otherEdges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: "interactive",
          data: {
            label: edge.label || edge.type,
            authorName: edge.data?.author_name || edge.author_name || "Desconocido",
            edgeIndex: staggeredIndex,
            isConsolidated: false,
            color: color,
            origin_space_title: edge.data?.origin_space_title || edge.origin_space_title || null,
          },
          className: animationClass,
          style: { stroke: color, strokeWidth: 3.5, opacity: edgeOpacity },
          markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color },
        });
      }
    });

    // Transformación final con opacidad en las consolidadas
    const processedConsolidated = Object.values(consolidatedMap).map((cEdge) => {
      const { sinergias, antagonismos, lastEdgeId } = cEdge.data;
      const total = sinergias + antagonismos;

      let color = RELATION_COLORS.conflicto;
      let label = `Diálogo Mixto (${sinergias}S | ${antagonismos}A)`;

      if (antagonismos === 0) {
        color = RELATION_COLORS.sinergia;
        label = `Sinergia Colectiva (${sinergias})`;
      } else if (sinergias === 0) {
        color = RELATION_COLORS.antagonismo;
        label = `Antagonismo Colectivo (${antagonismos})`;
      }

      const isNew = isPlaying && lastEdgeId && !animatedEdgesRef.current.has(lastEdgeId);
      const shouldReverse = isPlaying && cEdge.target === currentStepIdStr;

      const animationClassName = isNew
        ? (shouldReverse ? "growing-edge reverse" : "growing-edge")
        : "edge-static";

      // Aplicar atenuación si hay click/hover - Solo si NO está en reproducción
      let edgeOpacity = 0.9;
      if (!isPlaying && selectedNodeId) {
        edgeOpacity = (cEdge.source === selectedNodeId || cEdge.target === selectedNodeId) ? 0.9 : 0.08;
      } else if (!isPlaying && hoveredNodeId) {
        edgeOpacity = (cEdge.source === hoveredNodeId || cEdge.target === hoveredNodeId) ? 0.9 : 0.2;
      }

      return {
        ...cEdge,
        className: animationClassName,
        data: {
          ...cEdge.data,
          label,
          color,
          reverseAnim: shouldReverse
        },
        style: {
          stroke: color,
          strokeWidth: 3.5 + (total - 1) * 5,
          opacity: edgeOpacity,
          transition: 'stroke 0.5s ease, stroke-width 0.5s ease, opacity 0.3s ease'
        },
      };
    });

    const activeEdges = [...processedConsolidated, ...otherEdges];
    const metrics = calculateGraphMetrics(currentNodes, activeEdges);

    const finalNodes = currentNodes.map(node => {
      const nodeIdStr = node.id;
      return {
        ...node,
        data: {
          ...node.data,
          grado: metrics.degrees[nodeIdStr] || 0,
          centralidad: metrics.betweenness[nodeIdStr] || 0,
          comunidad: metrics.communities[nodeIdStr] ?? 0,
        }
      };
    });

    setNodes(finalNodes);
    setEdges(activeEdges);
  }, [
    nodoActualIdx,
    rondaActual,
    isPlaying,
    masterData,
    movieSequence,
    setNodes,
    setEdges,
    showEdges,
    relationFilter,
    selectedNodeId,
    hoveredNodeId,
    relationTypeFilter,
    selectedPerson,
    isCommunityLayoutOn
  ]);

  const handleNodesChange = useCallback((changes: any[]) => {
    // 1. Aplicar cambios al estado de ReactFlow
    onNodesChange(changes);

    // 2. Interceptar cambios de posición para guardarlos en memoria y localStorage
    let positionChanged = false;

    changes.forEach(change => {
      if (change.type === "position" && change.position) {
        const id = change.id.toString();
        const newPos = { x: change.position.x, y: change.position.y };

        fixedPositionsRef.current[id] = newPos;

        if (isCommunityLayoutOn) {
          communityPositionsRef.current[id] = newPos;
        } else {
          defaultPositionsRef.current[id] = newPos;
          positionChanged = true;
        }
      }
    });

    if (positionChanged) {
      try {
        localStorage.setItem(`fractalis-positions-${graphId}`, JSON.stringify(defaultPositionsRef.current));
      } catch (e) {
        console.error("Error saving positions to localStorage", e);
      }
    }
  }, [onNodesChange, isCommunityLayoutOn, graphId]);

  return {
    nodes, edges, onNodesChange: handleNodesChange, onEdgesChange, graphTitle,
    rondaActual, setRondaActual: handleSetRondaActual, maxRondas,
    isPlaying, setIsPlaying, velocidad, setVelocidad,
    masterData, nodoActualIdx, setNodoActualIdx, movieSequence,
    relationFilter, setRelationFilter, refreshGraph,
    isMerged, spacesMetadata,

    // EXPOSICIÓN DE NUEVOS ATRIBUTOS Y MÉTODOS DE CONTROL DEL CANVAS
    selectedNodeId, setSelectedNodeId,
    hoveredNodeId, setHoveredNodeId,
    relationTypeFilter, setRelationTypeFilter,
    selectedPerson, setSelectedPerson,
    isCommunityLayoutOn, setIsCommunityLayoutOn
  };
}