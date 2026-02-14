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

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const fixedPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const animatedEdgesRef = useRef<Set<string>>(new Set());

  const refreshGraph = useCallback(async () => {
    try {
      const data = await grafoService.getGraphData(graphId);
      console.log("🔍 [DATA ORIGINAL DEL SERVICIO]:", data); // <--- LOG AQUÍ
      console.log(data)
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
          },
          zIndex: isFocused ? 1000 : 10 + coloresActivos.length,
          position: fixedPositionsRef.current[nodeIdStr] || { x: 0, y: 0 },
        };
      });

    const currentVisibleIds = new Set(currentNodes.map((n) => n.id));

    // 2. PROCESAMIENTO DE ARISTAS (Lógica de Animación Corregida)
    const currentEdges: Edge[] = masterData.edges
      .filter((e) => {
        const sourceId = e.source.toString();
        const targetId = e.target.toString();
        if (!currentVisibleIds.has(sourceId) || !currentVisibleIds.has(targetId)) return false;

        const typeKey = (e.label || e.type || "").toLowerCase();
        const isPolaridad = ["sinergia", "antagonismo", "contradicts", "complementary_to"].includes(typeKey);
        if (relationFilter === "polaridad" && !isPolaridad) return false;
        if (relationFilter === "otros" && isPolaridad) return false;

        const edgeId = `e-${e.id}`;
        if (isPlaying && !showEdges && !animatedEdgesRef.current.has(edgeId)) return false;

        return RELATION_COLORS[typeKey] || e.type === "CONTRADICTS" || e.type === "COMPLEMENTARY_TO";
      })
      .map((edge) => {

        const edgeId = `e-${edge.id}`;
        const color = getEdgeColor(edge.label || edge.type || "");

        // Mantener SIEMPRE los originales para que la curva no cambie de forma
        const source = edge.source.toString();
        const target = edge.target.toString();

        const isConnectedToCurrentStep = isPlaying && currentStepIdStr && (source === currentStepIdStr || target === currentStepIdStr);
        const hasBeenAnimated = animatedEdgesRef.current.has(edgeId);

        // Determinamos si debe crecer "al revés" (del target al source)
        // solo para efectos visuales de CSS si el nodo nuevo es el target
        const shouldReverse = isPlaying && target === currentStepIdStr;

        if (isConnectedToCurrentStep && !hasBeenAnimated && showEdges) {
            setTimeout(() => animatedEdgesRef.current.add(edgeId), 100);
        }

        console.log("🔗 [PROCESANDO ARISTA INDIVIDUAL]:", edge); // <--- LOG AQUÍ

        return {
            id: edgeId,
            source,
            target,
            type: "interactive",
            data: {
                label: edge.label || edge.type,
                authorName: edge.data?.author_name || edge.author_name || "Desconocido",
                // Pasamos esta bandera para que el CSS sepa si invertir la animación
                reverseAnim: shouldReverse 
            },
            className: (isConnectedToCurrentStep && !hasBeenAnimated && showEdges) 
                ? (shouldReverse ? "growing-edge reverse" : "growing-edge") 
                : "edge-static",
            style: { stroke: color, strokeWidth: 3.5, opacity: 0.8 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color },
        };
      });

    setNodes(currentNodes);
    setEdges(currentEdges);
  }, [nodoActualIdx, rondaActual, isPlaying, masterData, movieSequence, setNodes, setEdges, showEdges, relationFilter]);

  return {
    nodes, edges, onNodesChange, onEdgesChange, graphTitle,
    rondaActual, setRondaActual: handleSetRondaActual, maxRondas,
    isPlaying, setIsPlaying, velocidad, setVelocidad,
    masterData, nodoActualIdx, setNodoActualIdx, movieSequence,
    relationFilter, setRelationFilter, refreshGraph
  };
}