"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNodesState, useEdgesState, useReactFlow, Node, Edge, MarkerType } from "reactflow";
import { calculateNodePositions } from "@/lib/graph-utils";
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

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const fixedPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const animatedEdgesRef = useRef<Set<string>>(new Set());

  const refreshGraph = useCallback(async () => {
    try {
      const data = await grafoService.getGraphData(graphId);
      console.log("🔍 [DATA ORIGINAL DEL SERVICIO]:", data); // <--- LOG AQUÍ
      console.log(data)

      try {
        const stats = await grafoService.getAdvancedStats(graphId);
        setAdvancedStats(stats);
      } catch (err) {
        console.error("No se pudieron cargar las estadísticas avanzadas:", err);
      }

      setGraphTitle(data.title);
      setMovieSequence(data.roadmap);

      fixedPositionsRef.current = calculateNodePositions(data.processedNodes);
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

    console.log("🎬 CURRENT STEP:", currentStep);

    // 1. PROCESAMIENTO DE NODOS
    const currentNodes: Node[] = masterData.nodes
      .filter((node) => {
        const nodeIdStr = node.id.toString();
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
          },
          zIndex: isFocused ? 1000 : 10 + coloresActivos.length,
          position: fixedPositionsRef.current[nodeIdStr] || { x: 0, y: 0 },
        };
      });

    const currentVisibleIds = new Set(currentNodes.map((n) => n.id));


// 2. PROCESAMIENTO DE ARISTAS (CONSOLIDACIÓN CON ANIMACIÓN ESTABLE)
    const consolidatedMap: Record<string, any> = {};
    const otherEdges: Edge[] = [];
    const pairCount: Record<string, number> = {};

    masterData.edges.forEach((edge) => {
      const sourceId = edge.source.toString();
      const targetId = edge.target.toString();

      if (!currentVisibleIds.has(sourceId) || !currentVisibleIds.has(targetId)) return;

      const typeKey = (edge.label || edge.type || "").toLowerCase();
      const isPolaridad = ["sinergia", "antagonismo", "contradicts", "complementary_to"].includes(typeKey);

      if (relationFilter === "polaridad" && !isPolaridad) return;
      if (relationFilter === "otros" && isPolaridad) return;

      const edgeId = `e-${edge.id}`;
      
      if (isPolaridad) {
        // Usamos una llave que siempre sea igual para el mismo par de nodos
        const pairKey = [sourceId, targetId].sort().join("-");
        const consolidatedId = `e-consolidated-${pairKey}`;

        // Lógica de visibilidad en playback para consolidadas
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
              lastEdgeId: edgeId // Guardamos el ID de la última arista real para animar
            }
          };
        }

        const isPositiva = typeKey === "sinergia" || typeKey === "complementary_to";
        if (isPositiva) consolidatedMap[pairKey].data.sinergias++;
        else consolidatedMap[pairKey].data.antagonismos++;

        consolidatedMap[pairKey].data.authors.push({
          name: edge.data?.author_name || edge.author_name || "Anónimo",
          type: typeKey
        });

        // Verificamos si esta arista específica es la que debe disparar la animación ahora
        const isConnected = isPlaying && currentStepIdStr && (sourceId === currentStepIdStr || targetId === currentStepIdStr);
        if (isConnected && !animatedEdgesRef.current.has(edgeId) && showEdges) {
            setTimeout(() => {
                animatedEdgesRef.current.add(edgeId);
            }, 100);
        }

// ... dentro del loop de masterData.edges.forEach ...
} else {
    const edgeId = `e-${edge.id}`;

    // 1. Si ya se animó, la mostramos siempre. Si no, esperamos al momento del playback.
    const hasBeenAnimated = animatedEdgesRef.current.has(edgeId);
    if (isPlaying && !showEdges && !hasBeenAnimated) return;

    const pairKeyNormal = [sourceId, targetId].sort().join("-");
    pairCount[pairKeyNormal] = (pairCount[pairKeyNormal] || 0) + 1;
    
    const staggeredIndex = (pairCount[pairKeyNormal] % 2 === 0 ? 1 : -1) * Math.ceil(pairCount[pairKeyNormal] / 2);

    const color = getEdgeColor(typeKey);
    const isConnected = isPlaying && currentStepIdStr && (sourceId === currentStepIdStr || targetId === currentStepIdStr);
    const shouldReverse = isPlaying && targetId === currentStepIdStr;

    // 2. Disparar la animación SOLO si es el momento justo y NO se ha animado antes
    if (isConnected && !hasBeenAnimated && showEdges) {
        setTimeout(() => {
            animatedEdgesRef.current.add(edgeId);
        }, 50);
    }

    // 3. LA CLAVE: Si ya está en el Set de animados, usamos "edge-static"
    // Solo usamos "growing-edge" si es la primera vez (isConnected && !hasBeenAnimated)
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
        },
        className: animationClass, 
        style: { stroke: color, strokeWidth: 3.5, opacity: 0.8 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color },
    });
}
    });

// ... (mantenemos el inicio del useEffect y el llenado de consolidatedMap igual)

// TRANSFORMACIÓN FINAL CON LÓGICA DE COLOR, ETIQUETA Y ANIMACIÓN RECUPERADA
const processedConsolidated = Object.values(consolidatedMap).map((cEdge) => {
  const { sinergias, antagonismos, lastEdgeId } = cEdge.data;
  const total = sinergias + antagonismos;
  
  // 1. Determinación de Color y Label
  let color = RELATION_COLORS.conflicto; 
  let label = `Diálogo Mixto (${sinergias}S | ${antagonismos}A)`;

  if (antagonismos === 0) {
    color = RELATION_COLORS.sinergia;
    label = `Sinergia Colectiva (${sinergias})`;
  } else if (sinergias === 0) {
    color = RELATION_COLORS.antagonismo;
    label = `Antagonismo Colectivo (${antagonismos})`;
  }

  // 2. Lógica de Animación (RECUPERADA)
  // Verificamos si la última intervención que compone esta arista consolidada se está animando
  const isNew = isPlaying && lastEdgeId && !animatedEdgesRef.current.has(lastEdgeId);
  const shouldReverse = isPlaying && cEdge.target === currentStepIdStr;

  // Clase CSS para el efecto de crecimiento
  const animationClassName = isNew 
    ? (shouldReverse ? "growing-edge reverse" : "growing-edge") 
    : "edge-static";

  return {
    ...cEdge,
    className: animationClassName, // Inyectamos la clase de animación
    data: {
      ...cEdge.data,
      label,
      color,
      reverseAnim: shouldReverse // Pasamos la dirección por si el CSS la necesita
    },
    style: { 
      stroke: color, 
      // Usamos el grosor dinámico que definimos (puedes ajustar el * 2 o * 5 aquí)
      strokeWidth: 3.5 + (total - 1) * 5, 
      opacity: 0.9,
      // La transición de stroke-width permite que la arista "engorde" suavemente
      transition: 'stroke 0.5s ease, stroke-width 0.5s ease'
    },
  };
});

setNodes(currentNodes);
setEdges([...processedConsolidated, ...otherEdges]);
  }, [nodoActualIdx, rondaActual, isPlaying, masterData, movieSequence, setNodes, setEdges, showEdges, relationFilter]);

  return {
    nodes, edges, onNodesChange, onEdgesChange, graphTitle,
    rondaActual, setRondaActual: handleSetRondaActual, maxRondas,
    isPlaying, setIsPlaying, velocidad, setVelocidad,
    masterData, nodoActualIdx, setNodoActualIdx, movieSequence,
    relationFilter, setRelationFilter, refreshGraph
  }
}