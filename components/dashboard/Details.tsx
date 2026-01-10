"use client";

import { FC } from 'react';
import { cn } from '@/lib/utils';

// --- Interfaces (PascalCase) ---
interface ItemDetails {
  titulo: string;
  fecha: string;
  cantidadParticipantes: number; 
  descripcion: string;
  participantes: string[];
}

interface DetailsProps {
  item: ItemDetails;
}

/**
 * Sub-componente interno (PascalCase)
 */
const DetailRow: FC<{ 
  label: string; 
  children: React.ReactNode; 
  isEven?: boolean 
}> = ({ label, children, isEven }) => (
  <div className={cn(
    "grid grid-cols-3 gap-4 p-4 transition-colors hover:bg-white/5",
    isEven && "bg-white/5"
  )}>
    <dt className="font-medium text-white col-span-1">{label}</dt>
    <dd className="text-white col-span-2">{children}</dd>
  </div>
);

// --- Componente Principal (PascalCase) ---
export default function Details({ item }: DetailsProps) {
  // Validación de seguridad (camelCase)
  if (!item) return null;

  return (
    <div className="flow-root bg-[#333333] rounded-xl border border-gray-700 shadow-lg overflow-hidden">
      <dl className="divide-y divide-gray-700 text-sm">
        
        {/* Fila: Título */}
        <DetailRow label="Título">
          <span className="font-semibold">{item.titulo}</span>
        </DetailRow>

        {/* Fila: Fecha */}
        <DetailRow label="Fecha de creación" isEven>
          {item.fecha}
        </DetailRow>

        {/* Fila: Participantes */}
        <DetailRow label="Participantes">
          {item.cantidadParticipantes} personas
        </DetailRow>

        {/* Fila: Integrantes */}
        <DetailRow label="Integrantes" isEven>
          <div className="flex flex-wrap gap-2">
            {item.participantes.map((nombreParticipante, index) => (
              <span 
                key={`${nombreParticipante}-${index}`} 
                className="bg-[#222222] border border-gray-600 px-2 py-0.5 rounded text-xs text-white shadow-sm"
              >
                {nombreParticipante}
              </span>
            ))}
          </div>
        </DetailRow>

        {/* Fila: Descripción */}
        <DetailRow label="Descripción">
          <p className="leading-relaxed whitespace-pre-line">
            {item.descripcion}
          </p>
        </DetailRow>
        
      </dl>
    </div>
  );
}