/**
 * Paleta de colores predefinida para los participantes del grafo.
 * Se utiliza para asignar una identidad visual única a cada autor y sus intervenciones.
 */
export const PERSON_COLORS = [
  "#3498db", // Azul
  "#e74c3c", // Rojo
  "#2ecc71", // Verde
  "#f1c40f", // Amarillo
  "#9b59b6", // Morado
  "#1abc9c", // Turquesa
  "#e67e22"  // Naranja
];

export const COMMUNITY_COLORS = [
  "#2563eb", // Azul royal
  "#a855f7", // Morado eléctrico
  "#f97316", // Naranja brillante
  "#22c55e", // Verde esmeralda
  "#ef4444", // Rojo intenso
  "#eab308", // Amarillo vibrante
  "#06b6d4", // Cian
  "#ec4899", // Rosa neón
  "#14b8a6", // Turquesa
];

/**
 * Colores para las relaciones semánticas del grafo.
 * Mapea el ID de la relación con un color hexadecimal.
 */

export const RELATION_COLORS: Record<string, string> = {
  causalidad: "#00E5FF",      // Cian eléctrico
  dependencia: "#3F51FF",     // Azul intenso
  ejemplificacion: "#800080", // Verde neón
  consecuencia: "#F5F5F5",   // Blanco
  sinergia: "#008000",       // Morado vivo
  antagonismo: "#FF1744",    // Rojo intenso
  conflicto: "#a855f7", // Morado para mezcla
};


/**
 * Parámetros de configuración para el algoritmo de posicionamiento de nodos.
 * Controla la distribución espacial y la densidad del grafo evolutivo.
 */
export const LAYOUT_CONFIG = {
  // Distancia mínima permitida entre nodos para evitar solapamientos visuales
  MIN_DIST: 450,
  
  // Distancia de separación entre diferentes grupos o clusters de nodos
  CLUSTER_STEP: 650,
  
  // Factor que determina la apertura de la espiral al posicionar nodos cronológicamente
  SPIRAL_FACTOR: 0.6,
};