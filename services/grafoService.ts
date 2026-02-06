import { PERSON_COLORS } from "../app/espacios/grafo/[id]/constants";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Servicio encargado de la recuperación y transformación de datos del grafo.
 */
export const grafoService = {
  getGraphData: async (graphId: string) => {
    const response = await fetch(`${BASE_URL}/api/graph/${graphId}`);
    if (!response.ok) throw new Error("Error al obtener el grafo");
    const data = await response.json();

    // Verificación de seguridad para evitar errores de carga
    if (!data.nodes || !Array.isArray(data.nodes)) {
      return { title: "Grafo vacío", processedNodes: [], rawEdges: [], peopleMap: {}, roadmap: [] };
    }

    /**
     * 1. Título y Mapeo de Personas
     * Ajustado para leer 'type' (del formateador del backend) o 'labels'
     */
    const topicNode = data.nodes.find((n: any) => 
      n.type === "Topic" || (n.labels && n.labels.includes("Topic"))
    );
    const title = topicNode?.data?.title || topicNode?.properties?.title || "Grafo de Diálogo";

    const peopleMap: Record<string, string> = {};
    data.nodes
      .filter((n: any) => n.type === "User" || (n.labels && n.labels.includes("User")))
      .forEach((p: any, idx: number) => {
        const name = p.data?.name || p.properties?.name;
        if (name) {
          peopleMap[name] = PERSON_COLORS[idx % PERSON_COLORS.length];
        }
      });

    /**
     * 2. Procesar Opiniones y Roadmap
     */
    const opinionsRaw = data.nodes.filter((n: any) => 
      n.type === "Opinion" || (n.labels && n.labels.includes("Opinion"))
    );
    
    const sortedOpinions = [...opinionsRaw].sort((a: any, b: any) => {
      const timeA = new Date(a.data?.timestamp || a.properties?.timestamp).getTime();
      const timeB = new Date(b.data?.timestamp || b.properties?.timestamp).getTime();
      return timeA - timeB;
    });

    const roadmap: any[] = [];
    const conceptData: Record<string, any> = {};

    sortedOpinions.forEach((op: any) => {
      const opProps = op.data || op.properties;
      
      // Identifica al autor buscando la relación "MADE_OPINION"
      const authorEdge = data.edges.find((e: any) => e.target === op.id && e.label === "MADE_OPINION");
      const author = authorEdge ? data.nodes.find((n: any) => n.id === authorEdge.source) : null;
      
      const authorName = author?.data?.name || author?.properties?.name || "Sistema";
      const authorColor = peopleMap[authorName] || "#57606f";

      // Conceptos mencionados en esta opinión
      const conceptEdges = data.edges.filter((e: any) => e.source === op.id && e.label === "CONTAINS");
      
      conceptEdges.forEach((edge: any) => {
        const conceptNode = data.nodes.find((n: any) => n.id === edge.target);
        if (!conceptNode) return;

        const cProps = conceptNode.data || conceptNode.properties;
        const opTime = new Date(opProps.timestamp).getTime();

        roadmap.push({
          id: conceptNode.id,
          name: cProps.name,
          timestamp: opTime,
          ronda: opProps.ronda,
          authorColor,
          authorName,
          opinionContent: opProps.text || opProps.content || "Sin contenido",
          opinionId: op.id,
        });

        if (!conceptData[conceptNode.id]) {
          conceptData[conceptNode.id] = {
            ronda: opProps.ronda,
            colorOriginal: authorColor,
            coloresMenciones: [authorColor],
            timestamp: opTime,
            menciones: [opTime],
          };
        } else {
          conceptData[conceptNode.id].menciones.push(opTime);
          conceptData[conceptNode.id].coloresMenciones.push(authorColor);
        }
      });
    });

    /**
     * 3. Procesar Nodos de Concepto Finales
     */
    const processedNodes = data.nodes
      .filter((n: any) => n.type === "Concept" || (n.labels && n.labels.includes("Concept")))
      .map((n: any) => {
        const cId = n.id;
        const currentProps = n.data || n.properties;
        
        return {
          ...n,
          // Aseguramos que data sea el contenedor principal para React Flow
          data: {
            ...currentProps,
            ronda: conceptData[cId]?.ronda || 1,
            color: conceptData[cId]?.colorOriginal || "#57606f",
            coloresMenciones: conceptData[cId]?.coloresMenciones || [],
            timestamp: conceptData[cId]?.timestamp || Date.now(),
            menciones: conceptData[cId]?.menciones || [],
          },
        };
      })
      .sort((a: any, b: any) => a.data.timestamp - b.data.timestamp);

    return { title, processedNodes, rawEdges: data.edges, peopleMap, roadmap };
  }
};