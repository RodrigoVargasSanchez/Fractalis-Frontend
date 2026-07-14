"use client";

import { cn } from "@/lib/utils";

interface StepperProps {
  currentStep: number;
}

export default function Stepper({ currentStep }: StepperProps) {
  const steps = [
    { number: 1, name: "Configuración", desc: "Detalles del Espacio" },
    { number: 2, name: "Carga de Registro", desc: "Subida de Conversación (.xlsx)" },
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-10 px-4 relative z-10">
      <div className="flex items-center justify-between relative">
        {/* Línea de conexión de fondo */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2 z-0 rounded" />
        
        {/* Línea de conexión activa (progreso) */}
        <div 
          className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-blue-500 to-blue-400 -translate-y-1/2 z-0 rounded transition-all duration-500 ease-in-out" 
          style={{ width: currentStep === 2 ? "100%" : "50%" }}
        />

        {steps.map((step) => {
          const isActive = currentStep >= step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center relative z-10">
              {/* Nodo */}
              <div 
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold transition-all duration-500",
                  isCurrent 
                    ? "bg-[#1a1a1a] border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110"
                    : isActive
                      ? "bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "bg-[#222222] border-white/20 text-white/40"
                )}
              >
                {step.number}
              </div>
              
              {/* Etiquetas */}
              <div className="text-center mt-3">
                <p 
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                    isCurrent ? "text-blue-400" : isActive ? "text-white/80" : "text-white/30"
                  )}
                >
                  {step.name}
                </p>
                <p className="text-[10px] font-mono text-white/40 mt-0.5 whitespace-nowrap">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
