"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";

import FileUpload from "@/components/ui/FileUpload"; 
import TableParticipants from "@/components/forms/TableParticipants";
import TableRelationships from "@/components/forms/TableRelationships";
import ErrorModal from "@/components/ui/ErrorModal";
import { useParticipants } from "@/hooks/useParticipants";
import { formatExcelDate, validateExcelRow } from "@/lib/excel-utils";
import { cn } from "@/lib/utils";
import { espaciosService } from "@/services/espaciosService";
import { RELATIONS_CONFIG } from "./constants";

/**
 * Componente principal de la página de subida de archivos.
 * Utiliza Suspense para manejar el estado de carga de los parámetros de búsqueda de Next.js.
 */
export default function SubirArchivoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" /></div>}>
      <SubirArchivoContent />
    </Suspense>
  );
}

/**
 * Contenido de la página de subida de archivos.
 * Gestiona la lectura de archivos Excel, validación de filas y envío final al servidor.
 */
function SubirArchivoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Recuperación de metadatos del espacio desde la URL
  const idsParam = searchParams.get("ids") || "";
  const titulo = searchParams.get("titulo") || "Nuevo Espacio";
  const descripcion = searchParams.get("descripcion") || "";

  // Hook personalizado para obtener los datos de los participantes seleccionados previamente
  const { participantes, loading: loadingParticipants } = useParticipants(idsParam);
  
  // Estados para el manejo de los datos del archivo y el flujo de la UI
  const [excelData, setExcelData] = useState<any[]>([]);
  const [fileUploadKey, setFileUploadKey] = useState(0); // Clave para resetear el input de archivo
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "" });
  const [selectedRelations, setSelectedRelations] = useState<string[]>([]);

  /**
   * Manejador de la carga de archivos.
   * Utiliza la librería XLSX para transformar el archivo binario en objetos JSON legibles.
   */
  const handleFileUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rawData.length === 0) throw new Error("El archivo está vacío.");

        // Preparación para la validación de integridad de datos
        const idsValidos = participantes.map(p => p.idArchivo);
        const uniqueRows = new Set();
        let lastTime = 0;

        // Procesamiento y validación fila por fila
        const validatedData = rawData.map((row, index) => {
          const rowFormatted = { ...row, Timestamp: formatExcelDate(row.Timestamp) };
          const { currentTime, hash } = validateExcelRow(rowFormatted, index + 2, idsValidos, lastTime);
          
          // Detección de duplicados mediante hash único por fila
          if (uniqueRows.has(hash)) throw new Error(`Fila ${index + 2}: Registro duplicado detectado.`);
          uniqueRows.add(hash);
          lastTime = currentTime;
          
          return rowFormatted;
        });
        setExcelData(validatedData);
      } catch (err: any) {
        setModal({ isOpen: true, title: "Error en el formato", message: err.message });
        setExcelData([]);
        setFileUploadKey(prev => prev + 1); // Reset del input en caso de error
      }
    };
    reader.readAsArrayBuffer(files[0]);
  };

  /**
   * Envío de datos al servicio backend.
   * Inicia el proceso de creación del espacio delegando el análisis a la IA.
   */
  const handleFinalizar = async () => {
    if (excelData.length === 0) return;

    if (selectedRelations.length === 0) return;

    setIsProcessing(true);

    const relacionesSeleccionadasCompletas = RELATIONS_CONFIG.filter(rel => 
      selectedRelations.includes(rel.id)
    );

    try {
      await espaciosService.createWithAI({
        titulo,
        descripcion,
        participantes,
        excelData,
        relaciones: relacionesSeleccionadasCompletas
      });

      // Redirección al listado principal tras éxito
      router.push("/espacios");
      router.refresh();
    } catch (err: any) {
      window.alert(err.message || "No se pudo conectar con el servidor.");
      router.back();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Overlay de procesamiento: Bloquea la interacción mientras la IA analiza los datos */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-wait">
          <div className="bg-[#333333] p-8 rounded-2xl border border-gray-700 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-xl font-bold animate-pulse">Procesando con IA...</p>
            <p className="text-gray-400 text-sm">Por favor, no cierres esta ventana.</p>
          </div>
        </div>
      )}

      {/* Modal para mostrar errores específicos de validación del Excel */}
      <ErrorModal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} 
      />

      <header className="space-y-4 border-b border-gray-800 pb-8 text-center">
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-tight">
          {titulo}
        </h1>
      </header>

      <main className="grid gap-8">
        {/* Vista previa de los participantes que deben coincidir con el archivo Excel */}
        <section className="bg-[#333333] rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-gray-700 bg-white/5 flex justify-between items-center">
            <h2 className="font-semibold text-white">Participantes en este espacio</h2>
          </div>
          <TableParticipants participantes={participantes} loading={loadingParticipants} />
        </section>

        <TableRelationships 
          relaciones={RELATIONS_CONFIG} 
          onSelectionChange={(ids) => {
            console.log("Relaciones actualizadas en el estado:", ids); // <--- AQUÍ
            setSelectedRelations(ids);
          }} 
        />

        {/* Zona de carga de archivos con validación visual */}
        <section className="bg-[#333333] p-8 rounded-2xl border border-gray-700 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Documentación del Proyecto</h2>
            <p className="text-sm text-gray-400">Sube el registro de la conversación para su análisis.</p>
          </div>

          <FileUpload 
            key={fileUploadKey} 
            onFilesSelected={handleFileUpload} 
            label="Selecciona el archivo Excel (.xlsx)" 
            accept=".xlsx, .xls"
          />

          {/* Indicador de éxito: Muestra el conteo de registros validados satisfactoriamente */}
          {excelData.length > 0 && !isProcessing && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm animate-in slide-in-from-top-2">
              <span>✅</span>
              <span>Archivo validado: <strong>{excelData.length} registros</strong> listos para IA.</span>
            </div>
          )}
        </section>
      </main>

      <footer className="flex justify-between items-center pt-6">
        <Link 
          href="/nuevo" 
          className={cn("text-gray-400 hover:text-white transition-all flex items-center gap-2", isProcessing && "pointer-events-none opacity-20")}
        >
          ← Volver atrás
        </Link>
        
        {/* Botón de finalización: Solo se habilita si hay datos cargados y no se está procesando */}
        <button 
          disabled={excelData.length === 0 || selectedRelations.length === 0 || isProcessing}
          onClick={handleFinalizar}
          className={cn(
            "bg-[#2596be] text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-3",
            "disabled:opacity-20 disabled:grayscale hover:bg-[#1e7a9c]",
            isProcessing && "animate-pulse"
          )}
        >
          {isProcessing ? "Procesando..." : "Finalizar y Guardar"}
        </button>
      </footer>
    </div>
  );
}