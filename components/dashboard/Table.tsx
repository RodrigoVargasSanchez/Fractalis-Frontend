"use client";

import Link from "next/link";
import { FC } from "react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";

// --- Interfaces (PascalCase) ---
interface DataItem {
  id: number;
  titulo: string;
  fecha: string;
  participantes: number;
  descripcion: string;
}

interface TableProps {
  data: DataItem[];
  onDelete: (id: number) => void;
}

/**
 * Sub-componente interno (PascalCase)
 */
const ActionButton: FC<{
  href?: string;
  onClick?: () => void;
  variant: "view" | "edit" | "delete";
  children: React.ReactNode;
}> = ({ href, onClick, variant, children }) => {
  const buttonVariants = {
    view: "text-blue-400 hover:text-white border-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] bg-[#1a1a1a]/60 hover:bg-blue-500/10",
    edit: "text-amber-400 hover:text-amber-300 border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-[#1a1a1a]/60 hover:bg-amber-500/10",
    delete: "text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] bg-[#1a1a1a]/60 hover:bg-red-500/10",
  };

  const buttonClassName = cn(
    "px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-300 active:scale-95 cursor-pointer",
    buttonVariants[variant]
  );

  if (href) {
    return (
      <Link href={href} className={buttonClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={buttonClassName}>
      {children}
    </button>
  );
};

// --- Componente Principal (PascalCase) ---
export default function Table({ data, onDelete }: TableProps) {
  const user = authService.getSessionUser();
  const isAdmin = user?.rol === "admin";

  return (
    <div className="rounded-2xl bg-[#2a2a2a]/60 backdrop-blur-xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/5 text-sm">
          <thead>
            <tr className="text-white border-b border-white/10">
              <th className="px-4 py-4 text-xs font-mono uppercase tracking-wider text-blue-400 text-left">Título</th>
              <th className="px-4 py-4 text-xs font-mono uppercase tracking-wider text-blue-400 text-left">Fecha de creación</th>
              <th className="px-4 py-4 text-xs font-mono uppercase tracking-wider text-blue-400 text-left">Participantes</th>
              <th className="px-4 py-4 text-xs font-mono uppercase tracking-wider text-blue-400 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-white/40 italic font-mono">
                  No hay datos disponibles para mostrar.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr 
                  key={item.id} 
                  className="text-white/80 hover:bg-white/5 border-b border-white/5 transition-all duration-300 group hover:text-white"
                >
                  <td className="px-4 py-4 font-semibold group-hover:text-blue-300 transition-colors">
                    {item.titulo}
                  </td>
                  <td className="px-4 py-4 opacity-70 font-mono text-xs">{item.fecha}</td>
                  <td className="px-4 py-4">
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                      {item.participantes} {item.participantes === 1 ? "Participante" : "Participantes"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <ActionButton variant="view" href={`/espacios/ver/${item.id}`}>
                        Ver
                      </ActionButton>

                      {isAdmin && (
                        <>
                          <ActionButton variant="edit" href={`/espacios/editar/${item.id}`}>
                            Editar
                          </ActionButton>

                          <ActionButton variant="delete" onClick={() => onDelete(item.id)}>
                            Eliminar
                          </ActionButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}