/**
 * Definición de los tipos de relaciones lógicas entre nodos.
 * Se utiliza para la tabla de configuración y para el motor de inferencia del grafo.
 */
export interface Relacion {
  id: string;
  nombre: string;
  descripcion: string;
  utilidad: string;
}

export const RELATIONS_CONFIG: Relacion[] = [
  { 
    id: "causalidad", 
    nombre: "Causalidad", 
    descripcion: "Una idea es el origen o la causa directa de que la otra exista.", 
    utilidad: "Identifica la raíz de los argumentos." 
  },
  { 
    id: "dependencia", 
    nombre: "Dependencia (Requisito)", 
    descripcion: "La idea B solo es válida si la idea A se acepta primero.", 
    utilidad: "Detecta 'castillos de naipes' argumentativos." 
  },
  { 
    id: "ejemplificacion", 
    nombre: "Ejemplificación", 
    descripcion: "El nodo B es un caso concreto o evidencia empírica que ilustra la idea A.", 
    utilidad: "Separa la teoría de la evidencia práctica." 
  },
  { 
    id: "consecuencia", 
    nombre: "Consecuencia (Impacto)", 
    descripcion: "La idea A conduce inevitablemente a un escenario B.", 
    utilidad: "Permite evaluar riesgos y beneficios." 
  },
  { 
    id: "sinergia", 
    nombre: "Sinergia", 
    descripcion: "Las ideas A y B se refuerzan mutuamente, creando un argumento más sólido juntas.", 
    utilidad: "Fortalece el núcleo central de una tesis." 
  },
  { 
    id: "antagonismo", 
    nombre: "Antagonismo", 
    descripcion: "La existencia o validez de la idea A contradice o anula directamente la idea B.", 
    utilidad: "Detecta inconsistencias lógicas y puntos de fricción." 
  },
];