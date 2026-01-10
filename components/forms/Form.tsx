"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// --- Interfaces (PascalCase) ---
interface Persona {
  id: string;
  nombre: string;
}

interface FormProps {
  personasDisponibles: Persona[];
}

// --- Componente Principal (PascalCase) ---
export default function Form({ personasDisponibles }: FormProps) {
  const router = useRouter();
  
  // --- Estado (camelCase) ---
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- Lógica de Negocio (camelCase) ---
  const personasFiltradas = personasDisponibles.filter((persona) =>
    persona.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    persona.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleParticipante = (id: string) => {
    setError(null); // Limpiar error al interactuar
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    
    // Validación de campos
    if (!titulo.trim()) {
      setError("Por favor, ingresa un título para el proyecto.");
      return;
    }

    if (seleccionados.length === 0) {
      setError("Debes seleccionar al menos un participante.");
      return;
    }

    const queryParams = new URLSearchParams({
      ids: seleccionados.join(','),
      titulo: titulo.trim(),
      descripcion: descripcion.trim()
    });

    router.push(`/nuevo/subir-archivo?${queryParams.toString()}`);
  };

  const inputClassName = "w-full bg-[#222222] border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#2596be] outline-none transition disabled:opacity-50";

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6 bg-[#333333] p-8 rounded-xl shadow-2xl border border-gray-700"
    >
      {/* SECCIÓN: INFORMACIÓN BÁSICA */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Título del Proyecto
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(event) => {
              setTitulo(event.target.value);
              if (error) setError(null);
            }}
            className={cn(inputClassName, error && !titulo && "border-red-500/50 ring-1 ring-red-500/20")}
            placeholder="Ej: Análisis Comunitario Zona Sur"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2 pt-4">
            Descripción
          </label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            className={cn(inputClassName, "resize-none")}
            placeholder="¿De qué trata este espacio?"
          />
        </div>
      </div>

      {/* SECCIÓN: SELECCIÓN DE PARTICIPANTES */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Participantes ({seleccionados.length} seleccionados)
        </label>
        
        <input
          type="text"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          className={inputClassName}
          placeholder="Buscar por nombre o ID..."
        />
        
        <div className="max-h-40 overflow-y-auto border border-gray-600 rounded-lg bg-[#222222] divide-y divide-gray-700 custom-scrollbar">
          {personasFiltradas.length > 0 ? (
            personasFiltradas.map((persona) => {
              const estaSeleccionado = seleccionados.includes(persona.id);
              return (
                <div
                  key={persona.id}
                  onClick={() => toggleParticipante(persona.id)}
                  className={cn(
                    "flex justify-between items-center p-3 cursor-pointer transition",
                    estaSeleccionado 
                      ? "bg-[#2596be]/20 text-white" 
                      : "text-gray-300 hover:bg-white/5"
                  )}
                >
                  <span className="text-sm font-medium">{persona.nombre}</span>
                  <span className="text-xs opacity-50 font-mono">{persona.id}</span>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-gray-500 text-sm italic text-center">
              No se encontraron participantes
            </div>
          )}
        </div>
      </div>

      {/* AVISO DE ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      {/* SECCIÓN: ACCIONES FINALIZACIÓN */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={() => router.push("/espacios")}
          className="text-red-400 hover:bg-red-400/10 border border-red-400/20 px-6 py-2 rounded-lg text-sm font-medium transition"
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          className={cn(
            "text-green-400 border border-green-400/20 px-6 py-2 rounded-lg text-sm font-medium transition shadow-lg hover:bg-green-400/10",
            (!titulo || seleccionados.length === 0) && "opacity-60"
          )}
        >
          Siguiente: Subir Archivo
        </button>
      </div>
    </form>
  );
}