"use client";

import { FC } from "react";
import { cn } from "@/lib/utils";

interface Participante {
  id: string;
  nombre: string;
  idArchivo: string;
}

interface TableParticipantsProps {
  participantes: Participante[];
  loading: boolean;
}

const Th: FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={cn("px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-gray-500", className)}>
    {children}
  </th>
);

export default function TableParticipants({ participantes, loading }: TableParticipantsProps) {
  if (loading) {
    return (
      <div className="p-12 text-center border border-white/5 rounded-lg bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-[#2596be] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Sincronizando participantes...</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-white/5 rounded-lg bg-[#0a0a0a]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            <Th>ID Sistema</Th>
            <Th>Nombre</Th>
            <Th>ID en Excel</Th>
            <Th className="text-right">Verificación</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {participantes.length > 0 ? (
            participantes.map((participante) => (
              <tr key={participante.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-[#2596be] font-bold tracking-tighter">
                  {participante.id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 font-medium">
                  {participante.nombre}
                </td>
                <td className="px-6 py-4">
                  <div className="inline-block bg-[#121212] border border-gray-800 rounded px-3 py-1">
                    <span className="text-xs text-white font-mono">
                      {participante.idArchivo}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Listo</span>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                // Esperando selección de la etapa anterior...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}