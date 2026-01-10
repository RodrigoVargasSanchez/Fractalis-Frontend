"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";

// Componentes
import FileUpload from "@/components/ui/FileUpload"; 
import TableParticipants from "@/components/forms/TableParticipants"; 
import ErrorModal from "@/components/ui/ErrorModal";

// Hooks y Utilidades
import { useParticipants } from "@/hooks/useParticipants";
import { formatExcelDate, validateExcelRow } from "@/lib/excel-utils";
import { cn } from "@/lib/utils";

export default function SubirArchivoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#2596be] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SubirArchivoContent />
    </Suspense>
  );
}

function SubirArchivoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // --- Parámetros de URL ---
  const idsParam = searchParams.get("ids") || "";
  const titulo = searchParams.get("titulo") || "Nuevo Espacio";
  const descripcion = searchParams.get("descripcion") || "";

  // --- Estado ---
  const { participantes, loading: loadingParticipants } = useParticipants(idsParam);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [fileUploadKey, setFileUploadKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "" });

  // --- Lógica: Procesamiento de Excel ---
  const handleFileUpload = (files: FileList | null) => {
    if (!files?.length) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rawData.length === 0) throw new Error("El archivo está vacío.");

        const idsValidos = participantes.map(p => p.idArchivo);
        const uniqueRows = new Set();
        let lastTime = 0;

        const validatedData = rawData.map((row, index) => {
          const rowFormatted = { 
            ...row, 
            Timestamp: formatExcelDate(row.Timestamp) 
          };
          
          const { currentTime, hash } = validateExcelRow(
            rowFormatted, 
            index + 2, 
            idsValidos, 
            lastTime
          );

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

  // --- Lógica: Finalizar y Enviar a IA ---
  const handleFinalizar = async () => {
    if (excelData.length === 0) return;
    setIsProcessing(true);

    try {
      const payload = {
        proyecto: titulo,
        descripcion: descripcion,
        participantes_db: participantes.map(p => ({
          db_id: p.id,
          archivo_id: p.idArchivo,
          nombre: p.nombre
        })),
        registros: excelData.map(row => {
          const pInfo = participantes.find(p => p.idArchivo === row.Participante);
          return {
            ronda: row.Ronda,
            participante_id_archivo: row.Participante,
            participante_db_id: pInfo ? pInfo.id : "No encontrado",
            contenido: row.Contenido,
            timestamp: row.Timestamp
          };
        })
      };

      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al procesar los datos.");
      }

      router.push("/espacios");
      router.refresh();

    } catch (err: any) {
      setModal({ 
        isOpen: true, 
        title: "Error al guardar", 
        message: err.message || "No se pudo conectar con el servidor." 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <ErrorModal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* HEADER */}
      <header className="space-y-4 border-b border-gray-800 pb-8">
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter text-center mb-4 leading-tight">
          {titulo}
        </h1>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="grid gap-8">
        {/* Tabla de Participantes */}
        <section className="bg-[#333333] rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-gray-700 bg-white/5 flex justify-between items-center">
            <h2 className="font-semibold text-white ">Participantes en este espacio</h2>
          </div>
          <TableParticipants participantes={participantes} loading={loadingParticipants} />
        </section>

        {/* Carga de Archivo */}
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

          {excelData.length > 0 && !isProcessing && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm animate-in slide-in-from-top-2">
              <span>✅</span>
              <span>Archivo validado: <strong>{excelData.length} registros</strong> listos para IA.</span>
            </div>
          )}
        </section>
      </main>

      {/* NAVEGACIÓN */}
      <footer className="flex justify-between items-center pt-6">
        <Link 
          href="/nuevo" 
          className={cn(
            "text-gray-400 hover:text-white transition-all flex items-center gap-2",
            isProcessing && "pointer-events-none opacity-20"
          )}
        >
          ← Volver atrás
        </Link>
        
        <button 
          disabled={excelData.length === 0 || isProcessing}
          onClick={handleFinalizar}
          className={cn(
            "bg-[#2596be] text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-3",
            "disabled:opacity-20 disabled:grayscale hover:bg-[#1e7a9c]",
            isProcessing && "animate-pulse"
          )}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando con IA...
            </>
          ) : (
            "Finalizar y Guardar"
          )}
        </button>
      </footer>
    </div>
  );
}