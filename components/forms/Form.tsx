"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Persona {
  id: string;
  nombre: string;
}

interface FormProps {
  personasDisponibles: Persona[];
}

export default function Form({ personasDisponibles }: FormProps) {
  const router = useRouter();
  
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const personasFiltradas = personasDisponibles.filter((persona) =>
    persona.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    persona.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleParticipante = (id: string) => {
    setError(null);
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    
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

  const inputBase = "w-full bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#2596be] focus:ring-1 focus:ring-[#2596be] outline-none transition-all duration-200";

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-8 bg-[#1a1a1a] p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5"
    >
      {/* SECCIÓN 1: DATOS DEL ESPACIO */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2596be] text-[10px] font-bold text-white">1</span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Detalles del Espacio</h2>
        </div>

        <div className="grid gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); if (error) setError(null); }}
              className={cn(inputBase, error && !titulo && "border-red-500/50 bg-red-500/5")}
              placeholder="Ej: Análisis de Debate Climático 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
              Descripción Breve
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={cn(inputBase, "resize-none")}
              placeholder="Contexto del debate o mesa redonda..."
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: PARTICIPANTES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2596be] text-[10px] font-bold text-white">2</span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Participantes</h2>
          </div>
          <span className="text-xs font-mono text-[#2596be] bg-[#2596be]/10 px-2 py-1 rounded-full">
            {seleccionados.length} seleccionados
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={cn(inputBase, "pl-11")}
              placeholder="Buscar por nombre o ID..."
            />
            <svg className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="max-h-52 overflow-y-auto border border-gray-800 rounded-xl bg-[#141414] custom-scrollbar">
            {personasFiltradas.length > 0 ? (
              <div className="divide-y divide-white/5">
                {personasFiltradas.map((persona) => {
                  const estaSeleccionado = seleccionados.includes(persona.id);
                  return (
                    <div
                      key={persona.id}
                      onClick={() => toggleParticipante(persona.id)}
                      className={cn(
                        "flex justify-between items-center p-4 cursor-pointer transition-colors group",
                        estaSeleccionado ? "bg-[#2596be]/10" : "hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          estaSeleccionado ? "bg-[#2596be] border-[#2596be]" : "border-gray-600"
                        )}>
                          {estaSeleccionado && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                        </div>
                        <span className={cn("text-sm transition-colors", estaSeleccionado ? "text-white font-medium" : "text-gray-400 group-hover:text-gray-200")}>
                          {persona.nombre}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">ID: {persona.id}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-gray-600 text-sm text-center">No se encontraron resultados</div>
            )}
          </div>
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs animate-in zoom-in-95 duration-200">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {/* ACCIONES */}
      <footer className="flex items-center justify-between pt-6 border-t border-white/5">
        <button
          type="button"
          onClick={() => router.push("/espacios")}
          className="text-gray-500 hover:text-white text-sm font-medium transition-colors"
        >
          Cancelar y volver
        </button>
        
        <button
          type="submit"
          className={cn(
            "bg-[#2596be] hover:bg-[#1e7a9c] text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95",
            (!titulo || seleccionados.length === 0) && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          Siguiente paso
        </button>
      </footer>
    </form>
  );
}