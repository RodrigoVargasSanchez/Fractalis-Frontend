"use client";

import { FC } from "react";
import { cn } from "@/lib/utils";

// --- Interfaces (PascalCase) ---
interface Participante {
  id: string;
  nombre: string;
  idArchivo: string;
}

interface TableParticipantsProps {
  participantes: Participante[];
  loading: boolean;
}

/**
 * Sub-componente interno (PascalCase)
 */
const Th: FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={cn("p-4 font-medium", className)}>{children}</th>
);

// --- Componente Principal (PascalCase) ---
export default function TableParticipants({ participantes, loading }: TableParticipantsProps) {
  
  // --- Estado de Carga (camelCase) ---
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400">
        <div className="w-6 h-6 border-2 border-[#2596be] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Cargando participantes...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-700">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#222222] text-gray-400 text-[11px] uppercase tracking-wider">
            <Th>ID</Th>
            <Th>Nombre Completo</Th>
            <Th>ID Archivo</Th>
            <Th className="text-right">Estado</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-[#2a2a2a]/30">
          {participantes.length > 0 ? (
            participantes.map((participante) => (
              <tr 
                key={participante.id} 
                className="text-gray-200 hover:bg-white/5 transition-colors group"
              >
                <td className="p-4 font-mono text-sm text-[#2596be] group-hover:brightness-110">
                  {participante.id}
                </td>
                <td className="p-4 text-sm">
                  {participante.nombre}
                </td>
                <td className="p-4 font-bold text-[#2596be] text-sm">
                  {participante.idArchivo}
                </td>
                <td className="p-4 text-right">
                  <span className="px-2 py-1 text-[10px] rounded-full bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap">
                    Confirmado
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-8 text-center text-gray-500 text-sm italic">
                No hay participantes seleccionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}