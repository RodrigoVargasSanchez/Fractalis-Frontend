"use client";

import { useEffect, useState } from "react";
import Form from "@/components/forms/Form";
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
   * Vista de carga de pantalla completa.
   * Utiliza un spinner animado con los colores corporativos mientras se sincronizan los datos.
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212]">
        <div className="w-12 h-12 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">Cargando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222222] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Encabezado: Presentación visual con logo y títulos de sección */}
        <header className="mb-12 text-center space-y-6">
          <img 
            src="/logofractalis.png" 
            alt="Fractal-IS Diálogo Logo" 
            className="mx-auto h-auto w-40 md:w-64 object-contain transition-transform hover:scale-105 duration-300"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Crear Nuevo Espacio</h1>
            <p className="text-gray-400 text-sm">Configura el entorno para tu análisis de debate</p>
          </div>
        </header>

        {/* Contenedor del Formulario con efectos visuales de gradiente y desenfoque */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#2596be]/20 to-blue-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative">
            {/* Componente Form encargado de la lógica de envío y validación de datos */}
            <Form personasDisponibles={listaPersonas} />
          </div>
        </div>
      </div>
    </div>
  );
}