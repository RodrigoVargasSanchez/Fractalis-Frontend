"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Details from "@/components/dashboard/Details";
import { fetchGraphQL } from "@/lib/graphql";

// --- Interfaces (PascalCase) ---
interface EspacioDetalle {
  id: number;
  titulo: string;
  fecha: string;
  cantidadParticipantes: number; // Corregido de cant_participantes a camelCase
  descripcion: string;
  participantes: string[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// --- Consultas GraphQL (UPPER_CASE) ---
const GET_ESPACIO_DETALLE_QUERY = `
  query GetEspacioById($id: Int!) {
    espacioByEspacioId(espacioId: $id) {
      espacioId
      espacioTitulo
      espacioDescripcion
      espacioFecha
      espacioParticipantesByEspacioId {
        totalCount
        nodes {
          usuarioByUsuarioId {
            usuarioNombre
          }
        }
      }
    }
  }
`;

export default function VerEspacioPage({ params }: PageProps) {
  // 1. Estado y Parámetros (camelCase)
  const resolvedParams = use(params);
  const [item, setItem] = useState<EspacioDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Carga y Formateo de Datos
  useEffect(() => {
    const cargarDetalle = async () => {
      try {
        const data = await fetchGraphQL(GET_ESPACIO_DETALLE_QUERY, { 
          id: Number(resolvedParams.id) 
        });
        
        const espacioData = data.espacioByEspacioId;

        if (espacioData) {
          const fechaObj = new Date(espacioData.espacioFecha);
          
          // Variables locales en camelCase descriptivo
          const fechaTexto = fechaObj.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          });
          
          const horaTexto = fechaObj.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          setItem({
            id: espacioData.espacioId,
            titulo: espacioData.espacioTitulo,
            fecha: `${fechaTexto} — ${horaTexto}`,
            descripcion: espacioData.espacioDescripcion || "Sin descripción",
            cantidadParticipantes: espacioData.espacioParticipantesByEspacioId.totalCount,
            participantes: espacioData.espacioParticipantesByEspacioId.nodes.map(
              (nodo: any) => nodo.usuarioByUsuarioId.usuarioNombre
            ),
          });
        }
      } catch (error) {
        console.error("Error al cargar el detalle:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDetalle();
  }, [resolvedParams.id]);

  // 3. Renderizado de Estados Auxiliares
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 animate-pulse">Cargando detalles del espacio...</p>
      </div>
    );
  }

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

  // 4. Renderizado Principal (PascalCase para Componentes)
  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          Detalles del Espacio
        </h1>
        <p className="text-gray-400 text-lg">
          Revisión de parámetros y configuración del diálogo.
        </p>
      </header>

      {/* Componente Modular */}
      <Details item={item} />

      {/* Navegación Inferior */}
      <footer className="mt-12 flex justify-between items-center border-t border-gray-800 pt-8">
        <Link 
          href="/espacios" 
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          Volver a Mis Espacios
        </Link>

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