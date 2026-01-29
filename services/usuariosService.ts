import { fetchGraphQL } from "@/lib/graphql";

/**
 * --- Interfaces ---
 * Define la estructura simplificada de un usuario para su uso en la interfaz.
 */
export interface Persona {
  id: string;
  nombre: string;
}

/**
 * --- Consultas GraphQL ---
 * Petición para recuperar todos los registros de la tabla usuarios.
 * Solo solicita el ID y el nombre para optimizar el ancho de banda.
 */
const GET_ALL_USUARIOS_QUERY = `
  query GetAllUsuarios {
    allUsuarios {
      nodes {
        usuarioId
        usuarioNombre
      }
    }
  }
`;

/**
 * --- Objeto del Servicio ---
 * Centraliza las operaciones relacionadas con la gestión de usuarios y participantes.
 */
export const usuariosService = {
  /**
   * Obtiene la lista completa de usuarios formateada para los selectores/formularios.
   * Transforma los tipos de datos nativos de la DB (Int) a los requeridos por los componentes (String).
   */
  getAllForForm: async (): Promise<Persona[]> => {
    // Ejecuta la consulta a través del helper de GraphQL
    const data = await fetchGraphQL(GET_ALL_USUARIOS_QUERY);
    
    // Mapea los nodos de la respuesta al formato de la interfaz Persona
    return data.allUsuarios.nodes.map((usuario: any) => ({
      id: usuario.usuarioId.toString(),
      nombre: usuario.usuarioNombre
    }));
  }
};