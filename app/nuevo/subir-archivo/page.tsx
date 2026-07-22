"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";

import FileUpload from "@/components/ui/FileUpload";
import TableParticipants from "@/components/forms/TableParticipants";
// Importación eliminada: TableRelationships ya no es necesario
import ErrorModal from "@/components/ui/ErrorModal";
import { useParticipants } from "@/hooks/useParticipants";
import { formatExcelDate, validateExcelRow } from "@/lib/excel-utils";
import { cn } from "@/lib/utils";
import { espaciosService } from "@/services/espaciosService";
import { RELATIONS_CONFIG } from "./constants";

export default function SubirArchivoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" /></div>}>
      <SubirArchivoContent />
    </Suspense>
  );
}

function SubirArchivoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idsParam = searchParams.get("ids") || "";
  const titulo = searchParams.get("titulo") || "Nuevo Espacio";
  const descripcion = searchParams.get("descripcion") || "";

  const { participantes, loading: loadingParticipants } = useParticipants(idsParam);

  const [excelData, setExcelData] = useState<any[]>([]);
  const [fileUploadKey, setFileUploadKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "" });

  /**
   * ESTADO ACTUALIZADO:
   * Ahora inicializamos directamente con todos los IDs disponibles en la configuración.
   */
  const [selectedRelations] = useState<string[]>(
    RELATIONS_CONFIG.map(rel => rel.id)
  );

  const handleFileUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rawData.length === 0) throw new Error("El archivo está vacío.");

        if (rawData.length < 2) {
          throw new Error(
            "Se requieren al menos 2 registros de conversación para realizar un análisis colaborativo (interacción entre colaboradores)."
          );
        }

        const idsValidos = participantes.map(p => p.idArchivo);
        const uniqueRows = new Set();
        let lastTime = 0;

        const validatedData = rawData.map((row, index) => {
          const rowFormatted = { ...row, Timestamp: formatExcelDate(row.Timestamp) };
          const { currentTime, hash } = validateExcelRow(rowFormatted, index + 2, idsValidos, lastTime);

          if (uniqueRows.has(hash)) throw new Error(`Fila ${index + 2}: Registro duplicado detectado.`);
          uniqueRows.add(hash);
          lastTime = currentTime;

          return rowFormatted;
        });
        setExcelData(validatedData);
      } catch (err: any) {
        setModal({ isOpen: true, title: "Error en el formato", message: err.message });
        setExcelData([]);
        setFileUploadKey(prev => prev + 1);
      }
    };
    reader.readAsArrayBuffer(files[0]);
  };

  const handleFinalizar = async () => {
    if (excelData.length === 0) return;
    // La validación de selectedRelations.length siempre pasará ahora.

    setIsProcessing(true);

    try {
      await espaciosService.createWithAI({
        titulo,
        descripcion,
        participantes,
        excelData,
        // Enviamos el array completo de RELATIONS_CONFIG
        relaciones: RELATIONS_CONFIG
      });

      router.push("/espacios");
      router.refresh();
    } catch (err: any) {
      window.alert(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-wait">
          <div className="bg-[#2a2a2a]/80 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col items-center gap-6 max-w-sm text-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-500/15 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-white text-xl font-extrabold tracking-wider uppercase bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">Procesando con IA</p>
              <p className="text-blue-400 font-mono text-xs uppercase tracking-widest">// Calculando inferencia de grafos</p>
            </div>
            <p className="text-white/40 text-xs font-mono">Por favor, no cierres esta ventana. Configurando relaciones y mapeando nodos semánticos...</p>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />

      <header className="mb-10 text-center space-y-6 relative z-10">
        <img
          src="/logofractalis.png"
          alt="Fractal-IS Diálogo Logo"
          className="mx-auto h-auto w-60 md:w-72 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-transform duration-300 hover:scale-105 cursor-pointer"
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-light uppercase tracking-widest text-white/95 truncate max-w-2xl mx-auto">{titulo}</h1>
          <p className="text-xs text-white uppercase tracking-wider mt-1">Ingesta de Datos y Mapeo de Red</p>
        </div>
      </header>

      <main className="grid gap-8 relative z-10">
        <section className="bg-[#2a2a2a]/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/80">Participantes en este espacio</h2>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
              Fase de Ingesta
            </span>
          </div>
          <TableParticipants participantes={participantes} loading={loadingParticipants} />
        </section>

        <section className="bg-[#2a2a2a]/60 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/90">Documentación del Proyecto</h2>
            <p className="text-xs text-white/40 font-mono uppercase mt-0.5">// Sube el registro de conversación en formato estructurado</p>
          </div>

          <FileUpload
            key={fileUploadKey}
            onFilesSelected={handleFileUpload}
            label="Selecciona el archivo Excel (.xlsx)"
            accept=".xlsx, .xls"
          />

          {excelData.length > 0 && !isProcessing && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-mono animate-in slide-in-from-top-2">
              <span>✅</span>
              <span>SISTEMA VALIDADO: <strong>{excelData.length} registros</strong> listos para inferencia IA.</span>
            </div>
          )}
        </section>
      </main>

      <footer className="flex justify-between items-center pt-6 relative z-10">
        <Link
          href="/nuevo"
          className={cn("text-white/40 hover:text-white transition-all text-xs font-mono uppercase tracking-wider flex items-center gap-2", isProcessing && "pointer-events-none opacity-20")}
        >
          ← Volver atrás
        </Link>

        <button
          disabled={excelData.length === 0 || isProcessing}
          onClick={handleFinalizar}
          className={cn(
            "relative overflow-hidden px-8 py-3.5 bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] active:scale-[0.98] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3",
            isProcessing && "animate-pulse"
          )}
        >
          {isProcessing ? "Procesando..." : "Finalizar y Guardar"}
        </button>
      </footer>
    </div>
  );
}