"use client";

import { useEffect, useState } from "react";
import Form from "@/components/forms/Form";
import Stepper from "@/components/ui/Stepper";
import { usuariosService, Persona } from "@/services/usuariosService";

/**
 * Componente de página para la creación de un nuevo Espacio de Diálogo.
 * Gestiona la carga previa de participantes necesarios para el formulario de configuración.
 */
export default function NuevoEspacioPage() {
  // Estado para almacenar la lista de personas/usuarios recuperados del backend
  const [listaPersonas, setListaPersonas] = useState<Persona[]>([]);
  // Estado para manejar la interfaz de carga inicial
  const [loading, setLoading] = useState(true);

  /**
   * Efecto para inicializar la página.
   * Recupera los usuarios disponibles para que el formulario pueda asignar participantes al nuevo espacio.
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Llamada al servicio especializado en datos para formularios
        const usuarios = await usuariosService.getAllForForm();
        setListaPersonas(usuarios);
      } catch (error) {
        console.error("Error al cargar usuarios de la DB:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  /**
   * Vista de carga.
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 relative z-10">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p className="text-blue-400 font-mono text-sm uppercase tracking-widest animate-pulse">
          // Inicializando Red de Usuarios...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 relative">
      {/* Resplandores de fondo */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10">
        {/* Encabezado: Presentación visual con logo y títulos de sección */}
        <header className="mb-10 text-center space-y-6">
          <img 
            src="/logofractalis.png" 
            alt="Fractal-IS Diálogo Logo" 
            className="mx-auto h-auto w-40 md:w-56 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-transform hover:scale-105 duration-300"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-light uppercase tracking-widest text-white/95">Crear Nuevo Espacio</h1>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-0.5">Configura el entorno para tu análisis de debate</p>
          </div>
        </header>

        {/* Flujo de Pasos (Stepper) */}
        <Stepper currentStep={1} />

        {/* Contenedor del Formulario */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-2xl blur-lg opacity-75 transition duration-1000 group-hover:opacity-100"></div>
          <div className="relative">
            {/* Componente Form encargado de la lógica de envío y validación de datos */}
            <Form personasDisponibles={listaPersonas} />
          </div>
        </div>
      </div>
    </div>
  );
}