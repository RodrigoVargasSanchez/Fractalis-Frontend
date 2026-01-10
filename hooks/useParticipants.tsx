import { useState, useEffect } from "react";
import { fetchGraphQL } from "@/lib/graphql";

export const useParticipants = (idsParam: string) => {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!idsParam) {
        setLoading(false);
        return;
      }
      
      const query = `
        query GetUsuariosSeleccionados {
          allUsuarios {
            nodes {
              usuarioId
              usuarioNombre
            }
          }
        }
      `;

      try {
        const data = await fetchGraphQL(query);
        const seleccionadosIds = idsParam.split(",");
        const counts: Record<string, number> = {};

        const procesados = data.allUsuarios.nodes
          .filter((u: any) => seleccionadosIds.includes(u.usuarioId.toString()))
          .map((u: any) => {
            const iniciales = u.usuarioNombre.split(" ").map((n: string) => n[0]).join("").toUpperCase();
            const idArchivo = !counts[iniciales] 
              ? (counts[iniciales] = 1, iniciales) 
              : `${iniciales}${++counts[iniciales]}`;
            
            return { id: u.usuarioId.toString(), nombre: u.usuarioNombre, idArchivo };
          });

        setParticipantes(procesados);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [idsParam]);

  return { participantes, loading };
};