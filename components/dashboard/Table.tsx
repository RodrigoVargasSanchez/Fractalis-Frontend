"use client";

import Link from "next/link";
import { FC } from "react";
import { cn } from "@/lib/utils";

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
  // Variable de configuración en camelCase
  const buttonVariants = {
    view: "text-blue-400 hover:bg-blue-400/10 border-blue-400/20",
    edit: "text-amber-400 hover:bg-amber-400/10 border-amber-400/20",
    delete: "text-red-400 hover:bg-red-400/10 border-red-400/20",
  };

  const buttonClassName = cn(
    "px-3 py-1.5 rounded text-xs font-medium border transition-all active:scale-95",
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
  return (
    <div className="rounded-lg bg-[#333333] p-6 shadow-2xl border border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm">
          <thead>
            <tr className="text-white border-b border-gray-700">
              <th className="px-4 py-4 font-bold text-left">Título</th>
              <th className="px-4 py-4 font-bold text-left">Fecha de creación</th>
              <th className="px-4 py-4 font-bold text-left">Participantes</th>
              <th className="px-4 py-4 font-bold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                  No hay datos disponibles para mostrar.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr 
                  key={item.id} 
                  className="text-gray-200 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-4 py-4 font-medium group-hover:text-white">
                    {item.titulo}
                  </td>
                  <td className="px-4 py-4 opacity-80">{item.fecha}</td>
                  <td className="px-4 py-4 opacity-80">{item.participantes}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <ActionButton variant="view" href={`/espacios/ver/${item.id}`}>
                        Ver
                      </ActionButton>
                      
                      <ActionButton variant="edit" href={`/espacios/editar/${item.id}`}>
                        Editar
                      </ActionButton>
                      
                      <ActionButton variant="delete" onClick={() => onDelete(item.id)}>
                        Eliminar
                      </ActionButton>
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