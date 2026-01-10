'use client';

import { useState, useEffect, useMemo } from "react";
import SortDropdown from "@/components/ui/SortDropdown";
import Table from "@/components/dashboard/Table";
import SearchBar from "@/components/ui/SearchBar";
import { fetchGraphQL } from "@/lib/graphql";

// --- Interfaces (PascalCase para Tipos/Interfaces) ---
interface Espacio {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  participantes: number;
}

// --- Constantes (UPPER_CASE) ---
const GET_ESPACIOS_QUERY = `
  query GetEspacios {
    allEspacios(orderBy: ESPACIO_FECHA_DESC) {
      nodes {
        espacioId
        espacioTitulo
        espacioDescripcion
        espacioFecha
        espacioParticipantesByEspacioId {
          totalCount
        }
      }
    }
  }
`;

const API_DELETE_URL = "http://localhost:5000/api/espacios";

export default function EspaciosPage() {
  // --- Estado (camelCase) ---
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCriteria, setSortCriteria] = useState("fecha");
  const [loading, setLoading] = useState(true);

  // --- Carga de datos ---
  useEffect(() => {
    const cargarEspacios = async () => {
      try {
        const data = await fetchGraphQL(GET_ESPACIOS_QUERY);
        
        // Variables internas (camelCase)
        const dataFormateada: Espacio[] = data.allEspacios.nodes.map((e: any) => {
          const fechaObj = new Date(e.espacioFecha);
          
          const fechaTexto = fechaObj.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          });
          
          const horaTexto = fechaObj.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          return {
            id: e.espacioId,
            titulo: e.espacioTitulo,
            descripcion: e.espacioDescripcion || "Sin descripción",
            fecha: `${fechaTexto} — ${horaTexto}`,
            participantes: e.espacioParticipantesByEspacioId.totalCount,
          };
        });

        setEspacios(dataFormateada);
      } catch (error) {
        console.error("Error al cargar espacios:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEspacios();
  }, []);

  // --- Handlers (camelCase) ---
  const handleEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este espacio?")) return;

    try {
      const response = await fetch(`${API_DELETE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error("Error al eliminar");

      setEspacios(prev => prev.filter(espacio => espacio.id !== id));
    } catch (error) {
      alert("No se pudo eliminar el espacio.");
    }
  };

  // --- Lógica Memorizada (camelCase) ---
  const processedData = useMemo(() => {
    // 1. Filtrar
    const filtered = espacios.filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        item.titulo.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term)
      );
    });

    // 2. Ordenar
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

  // --- Renderizado de estados auxiliares (PascalCase para componentes de UI) ---
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
      <header className="mb-16 text-center space-y-4">
        <img 
          src="/logofractalis.png" 
          alt="Fractal-IS Diálogo Logo" 
          className="mx-auto h-auto w-28 md:w-44 object-contain mb-6"
        />
        <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full opacity-50" />
      </header>
      
      {/* Barra de Controles */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="w-full md:w-1/3">
          <SearchBar 
            onSearch={setSearchTerm} 
            placeholder="Buscar por título o descripción..." 
          />
        </div>
        
        <SortDropdown onSort={setSortCriteria} />
      </div>
      
      {/* Tabla de Resultados (PascalCase) */}
      <div className="space-y-6">
        <Table data={processedData} onDelete={handleEliminar} />

        {processedData.length === 0 && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 italic">
              No se encontraron espacios que coincidan con tu búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}