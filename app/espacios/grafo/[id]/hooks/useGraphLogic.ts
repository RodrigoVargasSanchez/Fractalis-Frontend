import { useState, useEffect, useRef } from "react";
import { useNodesState, useEdgesState, useReactFlow, Node, Edge, MarkerType } from "reactflow";
import { calculateNodePositions } from "@/lib/graph-utils";
import { grafoService } from "@/services/grafoService";

/**
 * Interfaz para los datos maestros del grafo.
 */
interface MasterData {
  nodes: any[];
  edges: any[];
  personColors: Record<string, string>;
}

/**
 * Hook personalizado que encapsula toda la lógica de estado y animación del grafo.
 * Maneja la carga de datos, la línea de tiempo (rondas) y el modo de reproducción (cine).
 */
export function useGraphLogic(graphId: string) {
  // Hooks de ReactFlow para manipular la cámara
  const { fitView, setCenter } = useReactFlow();
  
  // Estados básicos del grafo
  const [graphTitle, setGraphTitle] = useState("Cargando...");
  const [masterData, setMasterData] = useState<MasterData>({ nodes: [], edges: [], personColors: {} });

  // Estados de la línea de tiempo y reproducción
  const [movieSequence, setMovieSequence] = useState<any[]>([]);
  const [rondaActual, setRondaActual] = useState(0);
  const [maxRondas, setMaxRondas] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [velocidad, setVelocidad] = useState(3);
  const [nodoActualIdx, setNodoActualIdx] = useState(-1);
  const [showEdges, setShowEdges] = useState(true);

  // Estados nativos de ReactFlow para nodos y aristas
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Referencias para mantener datos persistentes sin disparar re-renders innecesarios
  const fixedPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const animatedEdgesRef = useRef<Set<string>>(new Set());

  /**
   * 1. CARGA DE DATOS
   * Obtiene la información del servicio y pre-calcula las posiciones estáticas de los nodos.
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await grafoService.getGraphData(graphId);
        
        setGraphTitle(data.title);
        setMovieSequence(data.roadmap);
        
        // Calcula y almacena las posiciones fijas para evitar saltos visuales durante la reproducción
        fixedPositionsRef.current = calculateNodePositions(data.processedNodes);
        setMasterData({ nodes: data.processedNodes, edges: data.rawEdges, personColors: data.peopleMap });

        // Determina el número máximo de rondas presentes en el conjunto de datos
        const rondas = data.processedNodes.map((n: any) => n.properties.ronda);
        if (rondas.length > 0) setMaxRondas(Math.max(...rondas));
      } catch (error) {
        console.error("Error al cargar el grafo:", error);
      }
    };
    cargarDatos();
  }, [graphId]);

  /**
   * 2. LÓGICA DE TIEMPO
   * Gestiona el cambio manual de rondas y sincroniza el índice de la secuencia.
   */
  const handleSetRondaActual = (ronda: number) => {
    setRondaActual(ronda);
    animatedEdgesRef.current.clear(); // Limpia el historial de animaciones al saltar en el tiempo
    if (!isPlaying) {
      const firstNodeIdx = movieSequence.findIndex((s) => s.ronda === ronda);
      setNodoActualIdx(firstNodeIdx !== -1 ? firstNodeIdx - 1 : -1);
    }
  };

  /**
   * Temporizador de reproducción (Modo Cine).
   * Controla el avance automático entre los pasos de la secuencia según la velocidad definida.
   */
  useEffect(() => {
    let timer: any;
    if (isPlaying && nodoActualIdx < movieSequence.length - 1) {
      timer = setTimeout(() => {
        const nextIdx = nodoActualIdx + 1;
        setShowEdges(false); // Oculta aristas temporalmente para resaltar el nuevo nodo
        setNodoActualIdx(nextIdx);
        const currentRondaInMovie = movieSequence[nextIdx]?.ronda;
        if (currentRondaInMovie) setRondaActual(currentRondaInMovie);
      }, velocidad * 1000 + 1500);
    } else if (nodoActualIdx >= movieSequence.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, nodoActualIdx, movieSequence, velocidad]);

  /**
   * Orquestación de Cámara.
   * Realiza zoom al nodo activo y luego regresa a la vista general.
   */
  useEffect(() => {
    if (isPlaying && nodoActualIdx >= 0) {
      const step = movieSequence[nodoActualIdx];
      const pos = fixedPositionsRef.current[step?.id.toString()];
      if (pos) {
        // Enfoque en el nodo actual
        setCenter(pos.x, pos.y, { zoom: 2.2, duration: 800 });
        
        // Regreso a vista general tras un breve retraso
        const timerOut = setTimeout(() => {
          fitView({ duration: 1000, padding: 0.2 });
          // Muestra las aristas después de que la cámara se estabilice
          const edgeActivationTimer = setTimeout(() => setShowEdges(true), 1000);
          return () => clearTimeout(edgeActivationTimer);
        }, velocidad * 1000 * 0.8);
        return () => clearTimeout(timerOut);
      }
    }
  }, [nodoActualIdx, isPlaying, setCenter, fitView, velocidad, movieSequence]);

  /**
   * 3. RENDERIZADO DE ELEMENTOS
   * Filtra y transforma los datos maestros en componentes visuales de ReactFlow (Node y Edge).
   */
  useEffect(() => {
    if (masterData.nodes.length === 0) return;

    // Determina qué nodos deben ser visibles según el progreso actual
    const visibleIdsInSequence = isPlaying
      ? new Set(movieSequence.slice(0, nodoActualIdx + 1).map((step) => step.id))
      : null;

    const currentStep = movieSequence[nodoActualIdx];

    // Construcción de Nodos
    const currentNodes: Node[] = masterData.nodes
      .filter((node) => isPlaying ? visibleIdsInSequence?.has(node.id) : node.properties.ronda <= rondaActual)
      .map((node) => {
        const isFocused = isPlaying && node.id === currentStep?.id;
        // Calcula colores de menciones activos para el gráfico de pastel interno del nodo
        const coloresActivos = isPlaying
          ? movieSequence.slice(0, nodoActualIdx + 1).filter((s) => s.id === node.id).map((s) => s.authorColor)
          : node.properties.coloresMenciones;

        return {
          id: node.id.toString(),
          type: "circle",
          data: {
            label: node.properties.name,
            color: node.properties.color,
            ronda: node.properties.ronda,
            isFocused,
            mencionesCount: coloresActivos.length,
            coloresMenciones: coloresActivos,
            scale: 1 + (coloresActivos.length - 1) * 0.2, // El nodo crece según su relevancia
          },
          position: fixedPositionsRef.current[node.id.toString()] || { x: 0, y: 0 },
        };
      });

    const currentVisibleIds = new Set(currentNodes.map((n) => n.id));

    // Construcción de Aristas (Relaciones)
    const currentEdges: Edge[] = masterData.edges
      .filter((e) => {
        const t = e.type.toUpperCase();
        const isVisible = currentVisibleIds.has(e.source.toString()) && currentVisibleIds.has(e.target.toString());
        const edgeId = `e-${e.id}`;
        // Control de visibilidad para la animación secuencial
        if (isPlaying && !showEdges && !animatedEdgesRef.current.has(edgeId)) return false;
        return (t === "CONTRADICTS" || t === "COMPLEMENTARY_TO") && isVisible;
      })
      .map((edge) => {
        const edgeId = `e-${edge.id}`;
        const color = edge.type === "CONTRADICTS" ? "#ff4757" : "#2ecc71";
        const hasBeenAnimated = animatedEdgesRef.current.has(edgeId);

        let finalSource = edge.source.toString();
        let finalTarget = edge.target.toString();

        // Lógica para orientar la flecha siempre hacia el nodo que se acaba de crear/enfocar
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
          style: { stroke: color, strokeWidth: 4, opacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color },
        };
      });

    setNodes(currentNodes);
    setEdges(currentEdges);
  }, [nodoActualIdx, rondaActual, isPlaying, masterData, movieSequence, setNodes, setEdges, showEdges]);

  return {
    nodes, edges, onNodesChange, onEdgesChange, graphTitle,
    rondaActual, setRondaActual: handleSetRondaActual, maxRondas,
    isPlaying, setIsPlaying, velocidad, setVelocidad,
    masterData, nodoActualIdx, setNodoActualIdx, movieSequence,
  };
}