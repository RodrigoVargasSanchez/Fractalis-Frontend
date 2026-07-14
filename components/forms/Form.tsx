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

    setSeleccionados((prev) => {
      const estaSeleccionado = prev.includes(id);

      // Si ya está seleccionado, lo quitamos (siempre permitido)
      if (estaSeleccionado) {
        return prev.filter((p) => p !== id);
      }

      // Si NO está seleccionado, revisamos si ya llegamos al límite de 6
      if (prev.length >= 6) {
        setError("Solo puedes seleccionar un máximo de 6 participantes.");
        return prev; // Retornamos el estado anterior sin cambios
      }

      // Si hay espacio, lo agregamos
      return [...prev, id];
    });
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

  const inputBase = "w-full bg-[#1a1a1a]/85 border border-white/15 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] outline-none transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-sm";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-[#2a2a2a]/60 backdrop-blur-xl p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
    >
      {/* SECCIÓN 1: DATOS DEL ESPACIO */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono font-bold text-blue-400">01</span>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/80">Detalles del Espacio</h2>
        </div>

        <div className="grid gap-6">
          <div>
            <label className="block text-[10px] font-mono font-bold text-white/40 uppercase mb-2 ml-1">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); if (error) setError(null); }}
              className={cn(inputBase, error && !titulo && "border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500")}
              placeholder="Ej: Análisis de Debate Climático 2026"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-white/40 uppercase mb-2 ml-1">
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
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-mono font-bold text-blue-400">02</span>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/80">Participantes</h2>
          </div>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            {seleccionados.length} / 6 seleccionados
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
            <svg className="absolute left-4 top-4 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="max-h-52 overflow-y-auto border border-white/10 rounded-xl bg-[#131313]/90 custom-scrollbar divide-y divide-white/5">
            {personasFiltradas.length > 0 ? (
              <div className="divide-y divide-white/5">
                {personasFiltradas.map((persona) => {
                  const estaSeleccionado = seleccionados.includes(persona.id);
                  const alcanzadoMaximo = seleccionados.length >= 6;
                  const deshabilitado = alcanzadoMaximo && !estaSeleccionado;

                  return (
                    <div
                      key={persona.id}
                      onClick={() => !deshabilitado && toggleParticipante(persona.id)}
                      className={cn(
                        "flex justify-between items-center p-4 cursor-pointer transition-all duration-300 border-b border-white/5 group",
                        estaSeleccionado 
                          ? "bg-blue-500/10 text-white font-medium" 
                          : "text-white/60 hover:bg-white/5 hover:text-white",
                        deshabilitado && "opacity-20 cursor-not-allowed grayscale"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300",
                          estaSeleccionado 
                            ? "bg-blue-500 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                            : "border-white/20 group-hover:border-white/40"
                        )}>
                          {estaSeleccionado && <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                        </div>
                        <span className="text-sm font-semibold transition-colors">
                          {persona.nombre}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-40 font-mono tracking-widest uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5 group-hover:opacity-75 transition-opacity">
                        ID: {persona.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-white/30 text-xs font-mono text-center">// No se encontraron resultados</div>
            )}
          </div>
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-xl text-xs animate-in zoom-in-95 duration-200">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {/* ACCIONES */}
      <footer className="flex items-center justify-between pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={() => router.push("/espacios")}
          className="text-white/40 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
        >
          ← Cancelar y volver
        </button>

        <button
          type="submit"
          className={cn(
            "relative overflow-hidden px-8 py-3.5 bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            (!titulo || seleccionados.length === 0) && "opacity-30 cursor-not-allowed"
          )}
          disabled={!titulo || seleccionados.length === 0}
        >
          Siguiente paso
        </button>
      </footer>
    </form>
  );
}