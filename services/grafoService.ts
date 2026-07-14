import { PERSON_COLORS } from "../app/espacios/grafo/[id]/constants";
import { authService } from "./authService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Helper para obtener headers con token
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${authService.getToken()}`
});

/**
 * Servicio encargado de la recuperación, transformación y actualización de datos del grafo.
 */
export const grafoService = {
  /**
   * Envía una solicitud PATCH para renombrar conceptos y reestructurar el grafo en Neo4j.
   */
  updateConcepts: async (pid: string, updates: { oldName: string, newName: string }[]) => {
    const url = `${BASE_URL}/api/concepts/bulk-update`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ pid: parseInt(pid), updates }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: Fallo al actualizar conceptos`);
    }
    return response.json();
  },

  /**
   * Crea un nuevo concepto vinculado a una opinión específica.
   */
  createConcept: async (pid: string | number, name: string, opinionId: string) => {
    const url = `${BASE_URL}/api/concepts`;
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        pid: typeof pid === "string" ? parseInt(pid) : pid,
        name: name.trim(),
        opinionId
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No se pudo crear el concepto");
    return data;
  },


  /**
   * Obtiene métricas de red (grado, comunidad, centralidad) calculadas en el servidor.
   */
  getAdvancedStats: async (pid: string | number) => {
    const response = await fetch(`${BASE_URL}/api/graph/${pid}/stats`, {
      headers: getAuthHeaders(), // <--- FALTA ESTO
    });
    if (!response.ok) throw new Error("Error al obtener estadísticas avanzadas");
    return response.json();
  },

  /**
   * Solicita el análisis narrativo con IA basado en las intervenciones y las relaciones semánticas.
   */
  getNarrativeAnalysis: async (
    pid: string | number,
    payload: {
      titulo: string;
      descripcion: string;
      concepts: any[];
      relations: any[];
      interventions: any[];
    }
  ) => {
    const url = `${BASE_URL}/api/graph/${pid}/analysis`;
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No se pudo generar el análisis narrativo");
    return data;
  },

  /**
   * Crea una relación con atribución de autoría.
   */
  createEdge: async (
    pid: string | number,
    sourceId: string,
    targetId: string,
    type: string,
    opinionId: string
  ) => {
    const url = `${BASE_URL}/api/edges`;

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        pid: typeof pid === "string" ? parseInt(pid) : pid,
        sourceId,
        targetId,
        type,
        opinionId,
      }),
    });

    const data = await response.json().catch(() => ({}));

    // 🔥 MANEJO ESPECÍFICO 409
    if (response.status === 409) {
      return {
        success: false,
        duplicate: true,
        message: data.error,
        existingEdgeId: data.existingEdgeId,
      };
    }

    if (!response.ok) {
      throw new Error(data.error || "No se pudo crear la relación");
    }

    return {
      success: true,
      edgeId: data.edgeId,
    };
  },


  /**
   * Envía una solicitud PATCH para actualizar tipos de relaciones o eliminar aristas.
   */
  updateEdges: async (pid: string, updates: any[], deletions: string[]) => {
    const url = `${BASE_URL}/api/edges/bulk-update`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ pid: parseInt(pid), updates, deletions })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Fallo al actualizar relaciones");
    }
    return response.json();
  },

  deleteConcept: async (conceptId: string | number) => {
    const url = `${BASE_URL}/api/concepts/${conceptId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Fallo al eliminar el concepto");
    return response.json();
  },

  /**
   * Recupera el grafo completo y lo procesa para su uso en React Flow.
   */
  getGraphData: async (graphId: string) => {
    const response = await fetch(`${BASE_URL}/api/graph/${graphId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Error al obtener el grafo");
    const data = await response.json();
    console.log("🔥 ARISTAS CRUDAS DESDE EL BACKEND:", data.edges);

    // Verificación de integridad de datos
    if (!data.nodes || !Array.isArray(data.nodes)) {
      return { title: "Grafo vacío", processedNodes: [], rawEdges: [], peopleMap: {}, roadmap: [], isMerged: false, spacesMetadata: null };
    }

    // 1. Identificación del Título
    const topicNode = data.nodes.find((n: any) => n.type === "Topic" || (n.labels?.includes("Topic")));
    const title = topicNode?.data?.title || "Grafo de Diálogo";
    const isMerged = !!topicNode?.data?.is_merged;
    const spacesMetadata = topicNode?.data?.spaces_metadata ? JSON.parse(topicNode.data.spaces_metadata) : null;

    // 2. Mapeo de Colores por Participante
    const peopleMap: Record<string, string> = {};
    data.nodes
      .filter((n: any) => n.type === "User" || (n.labels?.includes("User")))
      .forEach((p: any, idx: number) => {
        const name = p.data?.name || p.properties?.name;
        if (name) peopleMap[name] = PERSON_COLORS[idx % PERSON_COLORS.length] || "#57606f";
      });

    // 3. Procesamiento de Opiniones y Roadmap
    const opinionsRaw = data.nodes.filter((n: any) => n.type === "Opinion" || (n.labels?.includes("Opinion")));
    const sortedOpinions = [...opinionsRaw].sort((a: any, b: any) => {
      const timeA = new Date(a.data?.timestamp || 0).getTime();
      const timeB = new Date(b.data?.timestamp || 0).getTime();
      return timeA - timeB;
    });

    const roadmap: any[] = [];
    const conceptData: Record<string, any> = {};
    const autoresPorConcepto: Record<string, string[]> = {};

    sortedOpinions.forEach((op: any) => {
      const opProps = op.data || op.properties;
      const authorEdge = data.edges?.find((e: any) => e.target === op.id && e.label === "MADE_OPINION");
      const author = authorEdge ? data.nodes.find((n: any) => n.id === authorEdge.source) : null;
      const authorName = author?.data?.name || "Sistema";
      const authorColor = peopleMap[authorName] || "#57606f";

      const conceptEdges = data.edges?.filter((e: any) => e.source === op.id && e.label === "CONTAINS") || [];
      conceptEdges.forEach((edge: any) => {
        const conceptNode = data.nodes.find((n: any) => n.id === edge.target);
        if (!conceptNode) return;
        const opTime = new Date(opProps.timestamp).getTime();

        roadmap.push({
          id: conceptNode.id,
          name: conceptNode.data?.name || conceptNode.data?.label,
          timestamp: opTime,
          ronda: opProps.ronda,
          authorColor,
          authorName,
          opinionContent: opProps.text || opProps.content,
          opinionId: op.id,
        });

        if (!autoresPorConcepto[conceptNode.id]) {
          autoresPorConcepto[conceptNode.id] = [];
        }
        if (authorName && !autoresPorConcepto[conceptNode.id].includes(authorName)) {
          autoresPorConcepto[conceptNode.id].push(authorName);
        }

        if (!conceptData[conceptNode.id]) {
          conceptData[conceptNode.id] = {
            ronda: opProps.ronda,
            colorOriginal: authorColor,
            coloresMenciones: [authorColor],
            timestamp: opTime,
            menciones: [opTime],
            authorName
          };
        } else {
          conceptData[conceptNode.id].menciones.push(opTime);
          conceptData[conceptNode.id].coloresMenciones.push(authorColor);
        }
      });
    });

    // 4. PROCESAMIENTO DE ARISTAS (CORREGIDO)
    const edgesToProcess = Array.isArray(data.edges) ? data.edges : [];

    const processedEdges = edgesToProcess.map((edge: any) => {
      const edgeAuthorColor = edge.data?.authorName ? peopleMap[edge.data.authorName] : null;

      // Registrar autoría en la lista de autores del concepto origen y destino
      const auth = edge.data?.authorName || edge.data?.author_name || edge.author_name;
      if (auth) {
        const s = edge.source;
        const t = edge.target;
        if (!autoresPorConcepto[s]) autoresPorConcepto[s] = [];
        if (!autoresPorConcepto[s].includes(auth)) autoresPorConcepto[s].push(auth);
        if (!autoresPorConcepto[t]) autoresPorConcepto[t] = [];
        if (!autoresPorConcepto[t].includes(auth)) autoresPorConcepto[t].push(auth);
      }

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: edgeAuthorColor || "#b1b1b7",
          strokeWidth: edgeAuthorColor ? 2.5 : 1.5,
        },
        labelStyle: { fill: edgeAuthorColor || "#888", fontWeight: 700 },
      };
    });

    // 5. Procesamiento Final de Nodos
    const processedNodes = data.nodes
      .filter((n: any) => n.type === "Concept" || (n.labels?.includes("Concept")))
      .map((n: any) => {
        const isMergedNode = !!n.data?.is_merged_node;
        const mergedColors = n.data?.origin_colors || [];

        return {
          ...n,
          data: {
            ...n.data,
            label: n.data.name || n.data.label,
            authorName: conceptData[n.id]?.authorName || "Sistema",
            color: isMergedNode && mergedColors.length ? mergedColors[0] : (conceptData[n.id]?.colorOriginal || "#57606f"),
            coloresMenciones: isMergedNode && mergedColors.length ? mergedColors : (conceptData[n.id]?.coloresMenciones || []),
            autoresMenciones: autoresPorConcepto[n.id] || [],
            timestamp: conceptData[n.id]?.timestamp || Date.now(),
          },
        };
      })
      .sort((a: any, b: any) => (a.data.timestamp || 0) - (b.data.timestamp || 0));

    return { title, processedNodes, rawEdges: processedEdges, peopleMap, roadmap, isMerged, spacesMetadata };
  }
};