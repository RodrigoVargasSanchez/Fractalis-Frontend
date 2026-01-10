"use client";

import { useEffect, useState } from "react";
import Form from "@/components/forms/Form";
import { fetchGraphQL } from "@/lib/graphql";

// --- Interfaces (PascalCase) ---
interface Persona {
  id: string; 
  nombre: string;
}

// --- Consultas GraphQL (UPPER_CASE) ---
const GET_ALL_USUARIOS_QUERY = `
  query GetAllUsuarios {
    allUsuarios {
      nodes {
        usuarioId
        usuarioNombre
      }
    }
  }
`;

export default function NuevoEspacioPage() {
  // --- Estado (camelCase) ---
  const [listaPersonas, setListaPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Carga de datos ---
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await fetchGraphQL(GET_ALL_USUARIOS_QUERY);
        
        // Mapeo con variable descriptiva en camelCase
        const usuariosFormateados: Persona[] = data.allUsuarios.nodes.map((usuario: any) => ({
          id: usuario.usuarioId.toString(),
          nombre: usuario.usuarioNombre
        }));

        setListaPersonas(usuariosFormateados);
      } catch (error) {
        console.error("Error al cargar usuarios de la DB:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  // --- Renderizado de carga ---
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Consultando usuarios en PostgreSQL...</p>
        </div>
      </div>
    );
  }

  // --- Renderizado Principal (PascalCase para Componentes) ---
  return (
    <div className="max-w-2xl mx-auto p-6">
      <header className="mb-10 text-center">
        <img 
          src="/logofractalis.png" 
          alt="Fractal-IS Diálogo Logo" 
          className="mx-auto h-auto w-28 md:w-44 object-contain mb-6"
        />
      </header>

      <div className="bg-[#1a1a1a]/30 rounded-2xl">
        {/* Pasando la variable de estado listaPersonas en camelCase */}
        <Form personasDisponibles={listaPersonas} />
      </div>
    </div>
  );
}