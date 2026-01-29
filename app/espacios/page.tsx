'use client';

import { useState, useEffect, useMemo } from "react";
import SortDropdown from "@/components/ui/SortDropdown";
import Table from "@/components/dashboard/Table";
import SearchBar from "@/components/ui/SearchBar";
import { espaciosService, Espacio } from "@/services/espaciosService";

/**
 * Componente principal de la página de Espacios.
 * Gestiona el estado de los datos, el filtrado, el ordenamiento y las acciones de borrado.
 */
export default function EspaciosPage() {
  // Estado para almacenar la lista de espacios obtenida de la API
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  // Estado para el término de búsqueda ingresado por el usuario
  const [searchTerm, setSearchTerm] = useState("");
  // Estado para el criterio de ordenamiento seleccionado
  const [sortCriteria, setSortCriteria] = useState("fecha");
  // Estado para controlar la visualización del indicador de carga
  const [loading, setLoading] = useState(true);

  /**
   * Efecto de carga inicial.
   * Realiza la petición al servicio para obtener todos los espacios al montar el componente.
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await espaciosService.getAll();
        setEspacios(data);
      } catch (error) {
        console.error("Error al cargar espacios:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  /**
   * Manejador para la eliminación de un registro.
   * Solicita confirmación y actualiza el estado local tras la respuesta exitosa del servicio.
   */
  const handleEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este espacio?")) return;
    try {
      await espaciosService.delete(id);
      setEspacios(prev => prev.filter(espacio => espacio.id !== id));
    } catch (error) {
      alert("No se pudo eliminar el espacio.");
    }
  };

  /**
   * Memorización de los datos procesados.
   * Filtra por título o descripción y aplica el ordenamiento según el criterio seleccionado.
   * Se recalcula solo cuando cambian los espacios, el término de búsqueda o el criterio de orden.
   */
  const processedData = useMemo(() => {
    const filtered = espacios.filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        item.titulo.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term)
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sortCriteria) {
        case 'fecha':
          return new Date(b.fecha.split(' — ')[0]).getTime() - new Date(a.fecha.split(' — ')[0]).getTime();
        case 'alfabetico':
          return a.titulo.localeCompare(b.titulo);
        case 'participantes_asc':
          return a.participantes - b.participantes;
        case 'participantes_desc':
          return b.participantes - a.participantes;
        default:
          return 0;
      }
    });
  }, [espacios, searchTerm, sortCriteria]);

  // Interfaz de carga mientras la petición asíncrona se completa
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Cargando datos reales...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      {/* Encabezado con logo, barra de búsqueda y opciones de ordenamiento */}
      <header className="flex flex-col items-center space-y-8 mb-12">
        <img src="/logofractalis.png" alt="Logo" className="h-auto w-40 md:w-64 object-contain" />
        <div className="w-full max-w-2xl">
          <SearchBar onSearch={setSearchTerm} placeholder="Buscar por título..." />
        </div>
        <div className="flex justify-center w-full">
          <SortDropdown onSort={setSortCriteria} />
        </div>
      </header>
      
      {/* Sección principal que renderiza la tabla o el mensaje de ausencia de datos */}
      <main className="space-y-6">
        <Table data={processedData} onDelete={handleEliminar} />
        {processedData.length === 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 italic">No se encontraron resultados.</p>
          </div>
        )}
      </main>
    </div>
  );
}