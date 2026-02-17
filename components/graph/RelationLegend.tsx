// components/graph/RelationLegend.tsx
import { RELATION_COLORS } from "@/app/espacios/grafo/[id]/constants";

interface RelationLegendProps {
  filter?: "polaridad" | "otros" | "todos";
}

export const RelationLegend = ({ filter = "todos" }: RelationLegendProps) => {
  // 1. Definimos qué llaves pertenecen a la categoría de "polaridad"
  const polaridadKeys = ["sinergia", "antagonismo", "conflicto"];

  // 2. Filtramos las entradas de RELATION_COLORS según el prop 'filter'
  const filteredEntries = Object.entries(RELATION_COLORS).filter(([key]) => {
    const isPolaridad = polaridadKeys.includes(key.toLowerCase());    
    if (filter === "polaridad") return isPolaridad;
    if (filter === "otros") return !isPolaridad;
    return true; // "todos"
  });

  return (
    <div className="bg-[#1a1a1a]/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
        Ontología de Relaciones
      </p>
      <div className="grid grid-cols-1 gap-3">
        {filteredEntries.map(([key, color]) => (
          <div key={key} className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Representación visual de la arista (línea) */}
            <div 
              className="w-8 h-[3px] rounded-full" 
              style={{ 
                backgroundColor: color, 
                boxShadow: `0 0 10px ${color}88` 
              }} 
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
              {key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};