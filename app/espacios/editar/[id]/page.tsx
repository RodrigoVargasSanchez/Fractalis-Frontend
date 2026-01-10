"use client";

import { use, useEffect, useState } from "react";
import EditForm from "@/components/forms/EditForm";
import { fetchGraphQL } from "@/lib/graphql";

// --- Interfaces (PascalCase) ---
interface EspacioEdit {
  id: number;
  titulo: string;
  descripcion: string;
  participantes: number;
  fecha: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// --- Consultas GraphQL (UPPER_CASE) ---
const GET_ESPACIO_QUERY = `
  query GetEspacioForEdit($id: Int!) {
    espacioByEspacioId(espacioId: $id) {
      espacioId
      espacioTitulo
      espacioDescripcion
      espacioFecha
      espacioParticipantesByEspacioId {
        totalCount
      }
    }
  }
`;

export default function EditarPage({ params }: PageProps) {
  // 1. Hooks y Estado (camelCase)
  const resolvedParams = use(params);
  const [itemToEdit, setItemToEdit] = useState<EspacioEdit | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Carga de Datos
  useEffect(() => {
    const cargarEspacio = async () => {
      try {
        const data = await fetchGraphQL(GET_ESPACIO_QUERY, { 
          id: Number(resolvedParams.id) 
        });
        
        // Variable en camelCase
        const espacioData = data.espacioByEspacioId;

        if (espacioData) {
          setItemToEdit({
            id: espacioData.espacioId,
            titulo: espacioData.espacioTitulo,
            descripcion: espacioData.espacioDescripcion || "",
            participantes: espacioData.espacioParticipantesByEspacioId.totalCount,
            fecha: espacioData.espacioFecha,
          });
        }
      } catch (error) {
        console.error("Error al cargar el espacio:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEspacio();
  }, [resolvedParams.id]);

  // 3. Renders Condicionales
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white">
        <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="opacity-60">Sincronizando con PostgreSQL...</p>
      </div>
    );
  }

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

  // 4. Render Principal (Componentes en PascalCase)
  return (
    <div className="max-w-2xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Editar Espacio</h1>
        <p className="text-white/80 mt-2">
          Modificando los detalles de:{" "}
          <span className="text-[#2596be] font-semibold">{itemToEdit.titulo}</span>
        </p>
      </header>

      <EditForm initialData={itemToEdit} />
    </div>
  );
}