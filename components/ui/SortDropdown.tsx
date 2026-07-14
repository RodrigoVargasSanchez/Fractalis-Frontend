"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

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
            "w-52 h-10 flex items-center justify-between rounded-xl border border-white/15 transition-all duration-300",
            "bg-[#1a1a1a]/85 text-white hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] focus:outline-none px-4 cursor-pointer"
          )}
        >
          <span className="text-sm font-semibold truncate pr-2">
            {selectedOption.label}
          </span>
          
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-white/40 transition-transform duration-300",
              isMenuOpen && "rotate-180 text-blue-400"
            )}
          />
        </button>

        {/* MENÚ DESPLEGABLE */}
        {isMenuOpen && (
          <div 
            className={cn(
              "absolute left-0 w-52 rounded-xl border border-white/10 bg-[#2a2a2a]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden",
              "z-[9999] top-full mt-1.5 p-1 animate-in fade-in slide-in-from-top-2 duration-200" 
            )}
          >
            {SORT_OPTIONS.map((sortOption) => {
              const isSelected = selectedOption.value === sortOption.value;
              
              return (
                <button
                  key={sortOption.value}
                  onClick={() => handleOptionSelect(sortOption)}
                  className={cn(
                    "block w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer",
                    "hover:bg-white/5 hover:text-white",
                    isSelected 
                      ? "text-blue-400 font-semibold bg-blue-500/10" 
                      : "text-white/70"
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