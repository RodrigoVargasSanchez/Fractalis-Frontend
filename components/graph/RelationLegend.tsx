// components/graph/RelationLegend.tsx
import { RELATION_COLORS } from "@/app/espacios/grafo/[id]/constants";

export const RelationLegend = () => {
  return (
    <div className="bg-[#1a1a1a]/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
        // Ontología de Relaciones
      </p>
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(RELATION_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-3">
            <div 
              className="w-8 h-[2px]" 
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} 
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