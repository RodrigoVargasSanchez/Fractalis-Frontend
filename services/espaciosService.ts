import { fetchGraphQL } from "@/lib/graphql";
import { Relacion } from "@/app/nuevo/subir-archivo/constants";
import { authService } from "./authService";

/**
 * --- Interfaces de Datos ---
 * Definen la estructura de los objetos que maneja el frontend para garantizar tipado fuerte.
 */
export interface Espacio {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  participantes: number;
  participantesIds?: string[];
}

export interface EspacioEdit extends Espacio { }

export interface EspacioDetalle {
  id: number;
  titulo: string;
  fecha: string;
  cantidadParticipantes: number;
  descripcion: string;
  participantes: string[];
}

/**
 * --- Consultas GraphQL ---
 * Queries optimizadas para obtener solo los campos necesarios de PostGraphile/GraphQL.
 */

// Obtiene el listado completo de espacios ordenados por fecha descendente
const GET_ESPACIOS_QUERY = `
  query GetEspacios {
    allEspacios(orderBy: ESPACIO_FECHA_DESC) {
      nodes {
        espacioId
        espacioTitulo
        espacioDescripcion
        espacioFecha
        espacioParticipantesByEspacioId {
          totalCount
          nodes {
            usuarioId
          }
        }
      }
    }
  }
`;

// Obtiene datos básicos de un espacio específico para el formulario de edición
const GET_ESPACIO_BY_ID_QUERY = `
  query GetEspacioForEdit($id: Int!) {
    espacioByEspacioId(espacioId: $id) {
      espacioId
      espacioTitulo
      espacioDescripcion
      espacioFecha
      espacioParticipantesByEspacioId {
        totalCount
      }
    }
  }
`;

// Obtiene la información detallada, incluyendo nombres de los participantes
const GET_ESPACIO_DETALLE_QUERY = `
  query GetEspacioById($id: Int!) {
    espacioByEspacioId(espacioId: $id) {
      espacioId
      espacioTitulo
      espacioDescripcion
      espacioFecha
      espacioParticipantesByEspacioId {
        totalCount
        nodes {
          usuarioByUsuarioId {
            usuarioNombre
          }
        }
      }
    }
  }
`;

/**
 * --- URLs y Configuración ---
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_DELETE_URL = `${BASE_URL}/api/espacios`;
const API_AI_URL = `${BASE_URL}/api/ai/chat`;

/**
 * Helper interno para formatear strings de fecha ISO a un formato legible por el usuario.
 */
const formatFechaDisplay = (fechaISO: string) => {
  const fechaObj = new Date(fechaISO);
  const fechaTexto = fechaObj.toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const horaTexto = fechaObj.toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit'
  });
  return `${fechaTexto} — ${horaTexto}`;
};

/**
 * --- Objeto del Servicio ---
 * Centraliza todas las operaciones relacionadas con la entidad "Espacio".
 */
export const espaciosService = {

  /**
   * 1. Obtiene todos los registros para la tabla principal.
   */
  getAll: async (): Promise<Espacio[]> => {
    const data = await fetchGraphQL(GET_ESPACIOS_QUERY);
    return data.allEspacios.nodes.map((e: any) => ({
      id: e.espacioId,
      titulo: e.espacioTitulo,
      descripcion: e.espacioDescripcion || "Sin descripción",
      fecha: formatFechaDisplay(e.espacioFecha),
      participantes: e.espacioParticipantesByEspacioId.totalCount,
      participantesIds: e.espacioParticipantesByEspacioId.nodes.map((n: any) => n.usuarioId),
    }));
  },

  /**
   * 2. Obtiene un registro por su ID único para edición.
   */
  getById: async (id: number): Promise<EspacioEdit | null> => {
    const data = await fetchGraphQL(GET_ESPACIO_BY_ID_QUERY, { id });
    const e = data.espacioByEspacioId;
    if (!e) return null;
    return {
      id: e.espacioId,
      titulo: e.espacioTitulo,
      descripcion: e.espacioDescripcion || "",
      participantes: e.espacioParticipantesByEspacioId.totalCount,
      fecha: e.espacioFecha,
    };
  },

  /**
   * 3. Obtiene el detalle completo para la página de visualización.
   */
  getDetalle: async (id: number): Promise<EspacioDetalle | null> => {
    const data = await fetchGraphQL(GET_ESPACIO_DETALLE_QUERY, { id });
    const e = data.espacioByEspacioId;

    if (!e) return null;

    return {
      id: e.espacioId,
      titulo: e.espacioTitulo,
      fecha: formatFechaDisplay(e.espacioFecha),
      descripcion: e.espacioDescripcion || "Sin descripción",
      cantidadParticipantes: e.espacioParticipantesByEspacioId.totalCount,
      participantes: e.espacioParticipantesByEspacioId.nodes.map(
        (nodo: any) => nodo.usuarioByUsuarioId.usuarioNombre
      ),
    };
  },

  /**
   * 4. Elimina un espacio mediante una petición DELETE REST.
   */
  delete: async (id: number): Promise<void> => {
    // Recuperamos el token actualizado antes de la petición
    const currentToken = authService.getToken();
    const response = await fetch(`${API_DELETE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });
    if (!response.ok) throw new Error("Error al eliminar el espacio");
  },

  /**
   * 5. Crea un nuevo espacio enviando los datos al motor de IA.
   */
  createWithAI: async (payload: {
    titulo: string;
    descripcion: string;
    participantes: any[];
    excelData: any[];
    relaciones: Relacion[];
  }): Promise<void> => {

    // Recuperamos el token actualizado para autorizar el procesamiento con IA
    const currentToken = authService.getToken();

    const body = {
      proyecto: payload.titulo,
      descripcion: payload.descripcion,
      relaciones_permitidas: payload.relaciones,
      participantes_db: payload.participantes.map(p => ({
        db_id: p.id,
        archivo_id: p.idArchivo,
        nombre: p.nombre
      })),
      registros: payload.excelData.map(row => {
        const pInfo = payload.participantes.find(p => p.idArchivo === row.Participante);
        return {
          ronda: row.Ronda,
          participante_id_archivo: row.Participante,
          participante_db_id: pInfo ? pInfo.id : "No encontrado",
          contenido: row.Contenido,
          timestamp: row.Timestamp
        };
      })
    };

    const response = await fetch(API_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Error al procesar los datos con la IA.");
    }
  }
};