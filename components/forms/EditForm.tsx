"use client";

import { useState, FC } from "react";
import { useRouter } from "next/navigation";
import { fetchGraphQL } from "@/lib/graphql";
import { cn } from "@/lib/utils";

// --- Interfaces (PascalCase) ---
interface EditFormProps {
  initialData: {
    id: number;
    titulo: string;
    descripcion: string;
    participantes: number;
  };
}

// --- Constantes (UPPER_CASE) ---
const UPDATE_ESPACIO_MUTATION = `
  mutation UpdateEspacio($id: Int!, $patch: EspacioPatch!) {
    updateEspacioByEspacioId(input: {
      espacioId: $id,
      espacioPatch: $patch
    }) {
      espacio {
        espacioId
        espacioTitulo
      }
    }
  }
`;

/**
 * Sub-componente interno (PascalCase)
 */
const FormField: FC<{
  label: string;
  isTextArea?: boolean;
  [key: string]: any; 
}> = ({ label, isTextArea, ...props }) => {
  const fieldClassName = "w-full bg-[#222222] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all";
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-200">{label}</label>
      {isTextArea ? (
        <textarea {...props} className={cn(fieldClassName, "resize-none")} rows={4} />
      ) : (
        <input {...props} className={fieldClassName} />
      )}
    </div>
  );
};

// --- Componente Principal (PascalCase) ---
export default function EditForm({ initialData }: EditFormProps) {
  const router = useRouter();
  
  // Estados (camelCase)
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // Handler (camelCase)
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await fetchGraphQL(UPDATE_ESPACIO_MUTATION, {
        id: formData.id,
        patch: {
          espacioTitulo: formData.titulo,
          espacioDescripcion: formData.descripcion
        }
      });

      router.push("/espacios");
      router.refresh(); 
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      alert("Hubo un error al guardar los cambios en la base de datos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-[#333333] p-8 rounded-xl shadow-2xl border border-gray-700 space-y-6"
    >
      <FormField 
        label="Título"
        type="text"
        value={formData.titulo}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
          setFormData({ ...formData, titulo: event.target.value })
        }
        disabled={isSaving}
        required
      />

      <FormField 
        label="Descripción"
        isTextArea
        value={formData.descripcion}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => 
          setFormData({ ...formData, descripcion: event.target.value })
        }
        disabled={isSaving}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSaving}
          className="text-red-400 hover:bg-red-400/10 border border-red-400/20 px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            "text-green-400 hover:bg-green-400/10 border border-green-400/20 px-6 py-2 rounded-lg text-sm font-medium transition shadow-lg disabled:opacity-50 flex items-center gap-2",
            isSaving && "cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Cambios"
          )}
        </button>
      </div>
    </form>
  );
}