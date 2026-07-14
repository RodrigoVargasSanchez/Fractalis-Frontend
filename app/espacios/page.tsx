'use client';

import { useState, useEffect, useMemo } from "react";
import SortDropdown from "@/components/ui/SortDropdown";
import Table from "@/components/dashboard/Table";
import SearchBar from "@/components/ui/SearchBar";
import { espaciosService, Espacio } from "@/services/espaciosService";
import { StatsPanelView } from "@/components/graph/StatsPanelView";
import { authService } from "@/services/authService";

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
    const user = authService.getSessionUser();
    const isAdmin = user?.rol === "admin";

    // Filtrar para mostrar solo los espacios en los que participa si no es admin
    const filteredByRole = isAdmin
      ? espacios
      : espacios.filter((item) => item.participantesIds?.includes(user?.usuarioId || ""));

    const filtered = filteredByRole.filter((item) => {
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
      <div className="flex flex-col items-center justify-center py-40 relative z-10">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p className="text-blue-400 font-mono text-sm uppercase tracking-widest animate-pulse">
          // Sincronizando Red de Datos...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 relative">
      {/* Efectos de resplandor de fondo en las esquinas */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Encabezado con logo, barra de búsqueda y opciones de ordenamiento */}
      <header className="flex flex-col items-center space-y-6 mb-12 relative z-20">
        <img
          src="/logofractalis.png"
          alt="Logo"
          className="h-auto w-40 md:w-56 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-transform duration-300 hover:scale-105"
        />
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-light uppercase tracking-widest text-white/95">
            Gestión de Espacios
          </h1>
          <p className="text-[10px] font-mono text-blue-400/80 uppercase tracking-wider mt-0.5">
            // Panel de Control Principal
          </p>
        </div>

        <div className="w-full max-w-2xl pt-4">
          <SearchBar onSearch={setSearchTerm} placeholder="Buscar por título o descripción..." />
        </div>
        <div className="flex justify-center w-full">
          <SortDropdown onSort={setSortCriteria} />
        </div>
      </header>

      {/* Sección principal que renderiza la tabla o el mensaje de ausencia de datos */}
      <main className="space-y-6 relative z-10">
        <Table data={processedData} onDelete={handleEliminar} />
        {processedData.length === 0 && (
          <div className="bg-[#2a2a2a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-16 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <p className="text-white/40 font-mono text-sm uppercase tracking-wider italic">
              // No se encontraron espacios de diálogo.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}