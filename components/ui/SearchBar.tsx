"use client";

import { useState, ChangeEvent } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

// --- CAMBIO AQUÍ ---
// Antes: "max-w-sm" (384px)
// Ahora: "max-w-xl" (576px) o puedes usar "max-w-2xl" para algo más imponente.
const CONTAINER_SIZE_CLASS = "max-w-xl";

export default function SearchBar({
  onSearch,
  placeholder = "Buscar por título o descripción..."
}: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchQuery(newValue);
    onSearch(newValue);
  };

  return (
    // He quitado el px-4 para que aproveche mejor el ancho si lo necesitas centrado
    <div className={cn("w-full mx-auto", CONTAINER_SIZE_CLASS)}>
      <div className="relative flex items-center group mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "block w-full pl-12 pr-12 py-3.5 text-sm transition-all duration-300 outline-none",
            "rounded-xl text-white placeholder-white/25",
            "bg-[#1a1a1a]/85 border border-white/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]", 
            "focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
          )}
        />

        {/* Lupa a la IZQUIERDA (Padding ajustado arriba a pl-12) */}
        <div className="absolute left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-white opacity-40 group-focus-within:text-blue-400 group-focus-within:opacity-100 transition-all duration-300" />
        </div>
      </div>
    </div>
  );
}