"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';

// --- Constantes (UPPER_CASE) ---
const SORT_OPTIONS = [
  { label: 'Fecha', value: 'fecha' },
  { label: 'Orden Alfabético', value: 'alfabetico' },
  { label: 'Participantes ASC', value: 'participantes_asc' },
  { label: 'Participantes DESC', value: 'participantes_desc' },
];

// --- Interfaces (PascalCase) ---
interface SortDropdownProps {
  onSort: (value: string) => void;
}

// --- Componente Principal (PascalCase) ---
export default function SortDropdown({ onSort }: SortDropdownProps) {
  // --- Estado (camelCase) ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(SORT_OPTIONS[0]);

  // --- Handlers (camelCase) ---
  const handleOptionSelect = (sortOption: typeof SORT_OPTIONS[0]) => {
    setSelectedOption(sortOption);
    setIsMenuOpen(false);
    onSort(sortOption.value);
  };

  return (
    <div className="flex justify-center items-center w-full h-10 mb-8 gap-4 relative z-[60]">
      <span className="text-white font-bold text-lg whitespace-nowrap">
        Ordenar por: &nbsp;
      </span>

      <div className="relative inline-block text-left">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          type="button"
          className={cn(
            "w-48 h-9 flex items-center justify-between rounded border border-gray-300 transition-colors",
            "bg-white text-black hover:bg-gray-100 focus:outline-none px-4"
          )}
        >
          <span className="text-sm font-semibold truncate pr-2">
            {selectedOption.label}&nbsp;
          </span>
          
          <img 
            src="/flecha-desplegar.png" 
            alt="Icono desplegar"
            style={{ width: '12px', height: '12px' }}
            className={cn(
              "transition-transform duration-200 flex-shrink-0 ",
              isMenuOpen && "rotate-180"
            )}
          />
        </button>

        {/* MENÚ DESPLEGABLE */}
        {isMenuOpen && (
          <div 
            className={cn(
              "absolute left-0 w-48 rounded border border-gray-700 bg-[#1a1a1a] shadow-2xl overflow-hidden",
              "z-[9999] top-full mt-1" 
            )}
            style={{ 
              position: 'absolute',
              minHeight: 'auto' 
            }}
          >
            {SORT_OPTIONS.map((sortOption) => {
              // Variable booleana en camelCase
              const isSelected = selectedOption.value === sortOption.value;
              
              return (
                <button
                  key={sortOption.value}
                  onClick={() => handleOptionSelect(sortOption)}
                  className={cn(
                    "block w-full text-left px-4 py-2.5 text-sm transition-colors",
                    "hover:bg-white/10",
                    isSelected 
                      ? "text-blue-400 font-bold bg-white/5" 
                      : "text-white"
                  )}
                >
                  {sortOption.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}