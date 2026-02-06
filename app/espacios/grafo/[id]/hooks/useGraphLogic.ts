"use client";

import { useState, useEffect, useRef } from "react";
import { useNodesState, useEdgesState, useReactFlow, Node, Edge, MarkerType } from "reactflow";
import { calculateNodePositions } from "@/lib/graph-utils";
import { grafoService } from "@/services/grafoService";
import { RELATION_COLORS } from "../constants";

interface MasterData {
  nodes: any[];
  edges: any[];
  personColors: Record<string, string>;
}

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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await grafoService.getGraphData(graphId);
        setGraphTitle(data.title);
        setMovieSequence(data.roadmap);
        fixedPositionsRef.current = calculateNodePositions(data.processedNodes);
        setMasterData({ nodes: data.processedNodes, edges: data.rawEdges, personColors: data.peopleMap });

        // CORRECCIÓN: Cálculo robusto de maxRondas comparando roadmap y nodos
        const rondasNodos = data.processedNodes.map((n: any) => n.data?.ronda || 0);
        const rondasRoadmap = data.roadmap.map((r: any) => r.ronda || 0);
        const maxFound = Math.max(...rondasNodos, ...rondasRoadmap, 1);
        
        setMaxRondas(maxFound);
        // Si es la carga inicial, nos aseguramos de estar en la última ronda disponible
        setRondaActual(maxFound);
      } catch (error) {
        console.error("Error al cargar el grafo:", error);
      }
    };
    cargarDatos();
  }, [graphId]);

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

    const visibleIdsInSequence = isPlaying
      ? new Set(movieSequence.slice(0, nodoActualIdx + 1).map((step) => step.id))
      : null;

    const currentStep = movieSequence[nodoActualIdx];

    const currentNodes: Node[] = masterData.nodes
      .filter((node) => {
        const rondaNodo = node.data?.ronda || 1;
        // CORRECCIÓN: Asegurar que la lógica de filtrado por ronda sea inclusiva
        return isPlaying ? visibleIdsInSequence?.has(node.id) : rondaNodo <= rondaActual;
      })
      .map((node) => {
        const nodeData = node.data || {};
        const isFocused = isPlaying && node.id === currentStep?.id;
        const coloresActivos = isPlaying
          ? movieSequence.slice(0, nodoActualIdx + 1).filter((s) => s.id === node.id).map((s) => s.authorColor)
          : nodeData.coloresMenciones || [];

        return {
          id: node.id.toString(),
          type: "circle",
          data: {
            label: nodeData.name || nodeData.label,
            color: nodeData.color,
            ronda: nodeData.ronda,
            isFocused,
            mencionesCount: coloresActivos.length,
            coloresMenciones: coloresActivos,
            scale: 1 + (coloresActivos.length - 1) * 0.2,
          },
          position: fixedPositionsRef.current[node.id.toString()] || { x: 0, y: 0 },
        };
      });

    const currentVisibleIds = new Set(currentNodes.map((n) => n.id));

    const currentEdges: Edge[] = masterData.edges
      .filter((e) => {
        const isVisible = currentVisibleIds.has(e.source.toString()) && currentVisibleIds.has(e.target.toString());
        const typeKey = (e.label || e.type || "").toLowerCase();

        let matchesFilter = true;
        const isPolaridad = ["sinergia", "antagonismo", "contradicts", "complementary_to"].includes(typeKey);
        
        if (relationFilter === "polaridad") {
          matchesFilter = isPolaridad;
        } else if (relationFilter === "otros") {
          matchesFilter = !isPolaridad;
        }

        const edgeId = `e-${e.id}`;
        if (isPlaying && !showEdges && !animatedEdgesRef.current.has(edgeId)) return false;
        
        const isValid = RELATION_COLORS[typeKey] || e.type === "CONTRADICTS" || e.type === "COMPLEMENTARY_TO";
        return isValid && isVisible && matchesFilter;
      })
      .map((edge) => {
        const edgeId = `e-${edge.id}`;
        const typeKey = (edge.label || edge.type || "").toLowerCase();
        
        let color = RELATION_COLORS[typeKey] || "#ffffff";
        if (edge.type === "CONTRADICTS") color = RELATION_COLORS.antagonismo;
        if (edge.type === "COMPLEMENTARY_TO") color = RELATION_COLORS.sinergia;

        const hasBeenAnimated = animatedEdgesRef.current.has(edgeId);
        let finalSource = edge.source.toString();
        let finalTarget = edge.target.toString();

        if (isPlaying && currentStep && (finalSource === currentStep.id.toString() || finalTarget === currentStep.id.toString())) {
          if (finalTarget === currentStep.id.toString()) {
            finalSource = edge.target.toString();
            finalTarget = edge.source.toString();
          }
          if (showEdges) animatedEdgesRef.current.add(edgeId);
        }

        return {
          id: edgeId,
          source: finalSource,
          target: finalTarget,
          type: "simplebezier",
          className: hasBeenAnimated ? "edge-static" : "growing-edge",
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
    relationFilter, setRelationFilter
  };
}