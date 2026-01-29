import { PERSON_COLORS } from "../app/espacios/grafo/[id]/constants";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Servicio encargado de la recuperación y transformación de datos del grafo.
 * Convierte nodos y relaciones crudas en una secuencia lógica (roadmap) para la UI.
 */
export const grafoService = {
  getGraphData: async (graphId: string) => {
    const response = await fetch(`${BASE_URL}/api/graph/${graphId}`);
    if (!response.ok) throw new Error("Error al obtener el grafo");
    const data = await response.json();

    /**
     * 1. Título y Mapeo de Personas
     * Extrae el nodo raíz del tema y asigna colores consistentes a cada usuario.
     */
    const topicNode = data.nodes.find((n: any) => n.labels.includes("Topic"));
    const title = topicNode ? topicNode.properties.title : "Grafo de Diálogo";

    const peopleMap: Record<string, string> = {};
    data.nodes
      .filter((n: any) => n.labels.includes("User"))
      .forEach((p: any, idx: number) => {
        // Asigna un color de la paleta constante basado en el índice del usuario
        peopleMap[p.properties.name] = PERSON_COLORS[idx % PERSON_COLORS.length];
      });

    /**
     * 2. Procesar Opiniones y Roadmap (Hoja de ruta)
     * Ordena las intervenciones cronológicamente para reconstruir la narrativa del debate.
     */
    const opinionsRaw = data.nodes.filter((n: any) => n.labels.includes("Opinion"));
    const sortedOpinions = [...opinionsRaw].sort(
      (a: any, b: any) => new Date(a.properties.timestamp).getTime() - new Date(b.properties.timestamp).getTime()
    );

    const roadmap: any[] = [];
    const conceptData: Record<string, any> = {};

    sortedOpinions.forEach((op: any) => {
      // Identifica al autor de la opinión buscando la relación "MADE_OPINION"
      const authorEdge = data.edges.find((e: any) => e.target === op.id && e.type === "MADE_OPINION");
      const author = authorEdge ? data.nodes.find((n: any) => n.id === authorEdge.source) : null;
      const authorColor = author ? peopleMap[author.properties.name] : "#57606f";
      const authorName = author ? author.properties.name : "Sistema";

      // Encuentra qué conceptos fueron mencionados o creados en esta opinión
      const conceptEdges = data.edges.filter((e: any) => e.source === op.id && e.type === "CONTAINS");
      conceptEdges.forEach((edge: any) => {
        const conceptNode = data.nodes.find((n: any) => n.id === edge.target);
        if (!conceptNode) return;

        // Alimenta la secuencia que usará el "Modo Cine" para reproducir el grafo
        roadmap.push({
          id: conceptNode.id,
          name: conceptNode.properties.name,
          timestamp: new Date(op.properties.timestamp).getTime(),
          ronda: op.properties.ronda,
          authorColor,
          authorName,
          opinionContent: op.properties.text || op.properties.content || "Sin contenido",
          opinionId: op.id,
        });

        // Agrupa metadatos por concepto: primera aparición (ronda) y rastro de menciones
        if (!conceptData[conceptNode.id]) {
          conceptData[conceptNode.id] = {
            ronda: op.properties.ronda,
            colorOriginal: authorColor,
            coloresMenciones: [authorColor],
            timestamp: new Date(op.properties.timestamp).getTime(),
            menciones: [new Date(op.properties.timestamp).getTime()],
          };
        } else {
          // Si el concepto ya existe, añadimos la nueva mención y el color del autor actual
          conceptData[conceptNode.id].menciones.push(new Date(op.properties.timestamp).getTime());
          conceptData[conceptNode.id].coloresMenciones.push(authorColor);
        }
      });
    });

    /**
     * 3. Procesar Nodos de Concepto Finales
     * Enriquece los nodos de tipo "Concept" con la información cronológica y visual procesada arriba.
     */
    const processedNodes = data.nodes
      .filter((n: any) => n.labels.includes("Concept"))
      .map((n: any) => ({
        ...n,
        properties: {
          ...n.properties,
          ronda: conceptData[n.id]?.ronda || 1,
          color: conceptData[n.id]?.colorOriginal || "#57606f",
          coloresMenciones: conceptData[n.id]?.coloresMenciones || [],
          timestamp: conceptData[n.id]?.timestamp || Date.now(),
          menciones: conceptData[n.id]?.menciones || [],
        },
      }))
      .sort((a: any, b: any) => a.properties.timestamp - b.properties.timestamp);

    // Devuelve el objeto unificado para que el hook useGraphLogic pueda consumirlo directamente
    return { title, processedNodes, rawEdges: data.edges, peopleMap, roadmap };
  }
};