"use client";

import { FC, useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
// Importamos el tipo desde tu archivo de constantes
import { Relacion } from "@/app/nuevo/subir-archivo/constants"; 

interface TableRelationsProps {
  relaciones: Relacion[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

const Th: FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={cn("px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-gray-500 bg-[#0a0a0a] sticky top-0 z-10", className)}>
    {children}
  </th>
);

export default function TableRelations({ relaciones, onSelectionChange }: TableRelationsProps) {
  // 1. Inicializamos el estado vacío para que el usuario empiece desde cero
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 2. Se ha eliminado el useEffect que sincronizaba relaciones -> selectedIds
  // para evitar que la tabla se marque completa automáticamente al cargar.

  const toggleRelacion = (id: string) => {
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    
    setSelectedIds(nextIds);
    
    // Notificar al componente padre si existe la función callback
    if (onSelectionChange) {
      onSelectionChange(nextIds);
    }
  };

  return (
    <div className="w-full border border-white/5 rounded-lg bg-[#0a0a0a] overflow-hidden">
      {/* Contenedor con Scrollbar personalizado */}
      <div className="w-full max-h-[400px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <Th className="w-10 text-center">Activo</Th>
              <Th>Nombre de la Relación</Th>
              <Th>Descripción</Th>
              <Th>Utilidad en el Análisis</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {relaciones.map((rel) => {
              const isSelected = selectedIds.includes(rel.id);
              return (
                <tr 
                  key={rel.id} 
                  onClick={() => toggleRelacion(rel.id)}
                  className={cn(
                    "hover:bg-white/[0.02] transition-colors group cursor-pointer",
                    !isSelected && "opacity-40 grayscale-[0.5]"
                  )}
                >
                  <td className="px-6 py-4 text-center">
                    <div className={cn(
                      "w-5 h-5 mx-auto rounded border transition-all flex items-center justify-center",
                      isSelected 
                        ? "bg-[#2596be] border-[#2596be] shadow-[0_0_10px_rgba(37,150,190,0.3)]" 
                        : "bg-transparent border-gray-700 group-hover:border-gray-500"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-sm font-bold tracking-tight transition-colors",
                      isSelected ? "text-[#2596be]" : "text-gray-500"
                    )}>
                      {rel.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 font-medium leading-relaxed max-w-xs">
                    {rel.descripcion}
                  </td>
                  <td className="px-6 py-4">
                    <div className="bg-[#121212] border border-gray-800 rounded px-3 py-2">
                      <p className="text-[11px] text-gray-400 font-mono italic">
                        // {rel.utilidad}
                      </p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}