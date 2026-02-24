// components/graph/GraphSkeleton.tsx
import React from 'react';

export const GraphSkeleton = () => {
  return (
    <div className="h-screen w-full bg-slate-50 relative overflow-hidden animate-pulse">
      {/* Simulación de Header */}
      <div className="absolute top-0 left-0 w-full h-16 bg-slate-200 border-b border-slate-300" />
      
      {/* Simulación de Nodos (Círculos) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-32 rounded-full bg-slate-200 mb-8 ml-20" />
        <div className="w-24 h-24 rounded-full bg-slate-200 -ml-40" />
        <div className="w-40 h-40 rounded-full bg-slate-200 ml-10" />
      </div>

      {/* Simulación de Panel Lateral Izquierdo */}
      <div className="absolute top-20 left-4 w-64 h-3/4 bg-slate-200 rounded-lg shadow-sm" />

      {/* Simulación de Panel Lateral Derecho */}
      <div className="absolute top-20 right-4 w-80 h-3/4 bg-slate-200 rounded-lg shadow-sm" />
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <p className="text-slate-400 font-medium">Cargando ecosistema...</p>
      </div>
    </div>
  );
};