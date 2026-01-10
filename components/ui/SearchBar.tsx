"use client";

import { useState, ChangeEvent } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Interfaces (PascalCase) ---
interface SearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

// --- Constantes de Diseño (UPPER_CASE) ---
// Opciones: max-w-xs (pequeño), max-w-sm, max-w-lg (grande)
const CONTAINER_SIZE_CLASS = "max-w-sm";

// --- Componente Principal (PascalCase) ---
export default function SearchBar({ 
  onSearch, 
  placeholder = "Buscar por título o descripción..." 
}: SearchProps) {
  // --- Estado (camelCase) ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Handlers (camelCase) ---
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchQuery(newValue);
    onSearch(newValue);
  };

  return (
    <div className={cn("w-full mx-auto px-4", CONTAINER_SIZE_CLASS)}>
      <div className="relative flex items-center group mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{ paddingLeft: '2.5rem' }} 
          className={cn(
            "block w-full pr-12 py-3 text-sm transition-all duration-300 outline-none",
            "rounded-full text-white placeholder-gray-500",
            "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]", 
            "border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]", 
            "focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
          )}
        />

        <div className="absolute right-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
          <Search className="w-5 h-5 text-white opacity-70 group-focus-within:opacity-100" />
        </div>
      </div>
    </div>
  );
}