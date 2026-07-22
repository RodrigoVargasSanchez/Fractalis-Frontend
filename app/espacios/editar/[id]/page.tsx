"use client";

import { use, useEffect, useState } from "react";
import EditForm from "@/components/forms/EditForm";
import { espaciosService, EspacioEdit } from "@/services/espaciosService";

/**
 * Interfaz para las propiedades de la página.
 * Define params como una Promesa para cumplir con las convenciones de Next.js en Client Components.
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Componente de página para la edición de un espacio existente.
 * Se encarga de obtener los parámetros de la URL, cargar los datos de la base de datos y proveerlos al formulario.
 */
export default function EditarPage({ params }: PageProps) {
  // Desenvuelve la promesa de los parámetros utilizando el hook 'use'
  const resolvedParams = use(params);
  
  // Estado para almacenar los datos del objeto a editar
  const [itemToEdit, setItemToEdit] = useState<EspacioEdit | null>(null);
  
  // Estado para gestionar el feedback visual durante la carga de datos
  const [loading, setLoading] = useState(true);

  /**
   * Efecto para cargar los datos del espacio basándose en el ID de la URL.
   * Se ejecuta cada vez que el ID resuelto cambia.
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Convierte el ID a número y realiza la petición al servicio
        const data = await espaciosService.getById(Number(resolvedParams.id));
        setItemToEdit(data);
      } catch (error) {
        console.error("Error al cargar el espacio:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [resolvedParams.id]);

  // Efecto para actualizar el título del navegador con el nombre del espacio a editar
  useEffect(() => {
    if (itemToEdit) {
      document.title = `${itemToEdit.titulo} - Editar - Fractalis`;
    }
  }, [itemToEdit]);

  /**
   * Renderizado de estado de carga.
   * Muestra un spinner animado mientras se espera la respuesta de la base de datos.
   */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white">
        <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="opacity-60">Sincronizando con PostgreSQL...</p>
      </div>
    );
  }

  /**
   * Renderizado de error en caso de que no se encuentre el registro.
   * Proporciona feedback al usuario sobre la inexistencia del ID consultado.
   */
  if (!itemToEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white text-center">
        <h2 className="text-xl font-bold text-red-400">Espacio no encontrado</h2>
        <p className="opacity-60 text-sm mt-2">
          El ID "{resolvedParams.id}" no existe en la base de datos.
        </p>
      </div>
    );
  }

  /**
   * Renderizado principal de la página de edición.
   * Incluye el encabezado con el título dinámico y el componente EditForm con los datos precargados.
   */
  return (
    <div className="max-w-2xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Editar Espacio</h1>
        <p className="text-white/80 mt-2">
          Modificando los detalles de:{" "}
          <span className="text-[#2596be] font-semibold">{itemToEdit.titulo}</span>
        </p>
      </header>

      {/* Componente de formulario que recibe los datos iniciales para su edición */}
      <EditForm initialData={itemToEdit} />
    </div>
  );
}