"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Details from "@/components/dashboard/Details";
import { espaciosService, EspacioDetalle } from "@/services/espaciosService";

/**
 * Definición de las propiedades esperadas por la página.
 * Los parámetros de la ruta se manejan como una promesa para la compatibilidad con las versiones recientes de Next.js.
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Componente de visualización detallada de un espacio.
 * Se encarga de la obtención de datos extendidos y la presentación de los metadatos del registro.
 */
export default function VerEspacioPage({ params }: PageProps) {
  // Desencapsula los parámetros de la URL de manera asíncrona
  const resolvedParams = use(params);
  
  // Estado para almacenar el objeto detallado del espacio
  const [item, setItem] = useState<EspacioDetalle | null>(null);
  
  // Estado para gestionar la visibilidad de la interfaz de carga
  const [loading, setLoading] = useState(true);

  /**
   * Efecto para recuperar la información detallada desde el servicio.
   * Se dispara automáticamente cuando el ID resuelto cambia.
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Llama al método específico para obtener detalles por ID numérico
        const data = await espaciosService.getDetalle(Number(resolvedParams.id));
        setItem(data);
      } catch (error) {
        console.error("Error al cargar el detalle:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [resolvedParams.id]);

  /**
   * UI de carga.
   * Proporciona un feedback visual animado mientras se procesa la solicitud asíncrona.
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 animate-pulse">Cargando detalles del espacio...</p>
      </div>
    );
  }

  /**
   * Gestión de registros no encontrados.
   * Muestra un mensaje de error y un enlace de retorno si la base de datos no devuelve el ítem.
   */
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold text-red-400">Espacio no encontrado</h2>
        <Link href="/espacios" className="mt-4 text-[#2596be] hover:underline">
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Cabecera de la página de detalles */}
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          Detalles del Espacio
        </h1>
        <p className="text-gray-400 text-lg">
          Revisión de parámetros y configuración del diálogo.
        </p>
      </header>

      {/* Componente que renderiza los campos específicos del objeto recuperado */}
      <Details item={item} />

      {/* Pie de página con navegación secundaria y acceso a visualizaciones adicionales */}
      <footer className="mt-12 flex justify-between items-center border-t border-gray-800 pt-8">
        <Link 
          href="/espacios" 
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          Volver a Mis Espacios
        </Link>

        {/* Acceso directo a la vista de grafo basada en el ID del elemento actual */}
        <Link
          href={`/espacios/grafo/${item.id}`}
          className="bg-[#2596be] hover:bg-[#1e7a9c] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          Ver Grafo Evolutivo
        </Link>
      </footer>
    </div>
  );
}