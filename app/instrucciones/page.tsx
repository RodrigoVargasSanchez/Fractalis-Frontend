"use client";

import React from "react";
import * as XLSX from "xlsx";
import { Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

export default function InstruccionesPage() {
  const descargarTemplate = () => {
    const workbook = XLSX.utils.book_new();

    const data = [
      {
        Ronda: "1",
        Participante: "CS",
        Contenido: "Ejemplo de intervención: Escriba aquí el texto de la conversación.",
        Timestamp: 45662.7916666667 // 05-01-2025 19:00:00
      },
      {
        Ronda: "1",
        Participante: "CS2",
        Contenido: "Respuesta de ejemplo: El segundo participante aporta información adicional.",
        Timestamp: 45662.7951388889 // 05-01-2025 19:05:00
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const formatoTimestamp = 'dd-mm-yyyy"  "hh:mm:ss';
    
    for (let i = 2; i <= 500; i++) {
      const cellAddress = `D${i}`;
      
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 'n', v: undefined, z: formatoTimestamp };
      } else {
        worksheet[cellAddress].t = 'n';
        worksheet[cellAddress].z = formatoTimestamp;
      }
    }

    worksheet["!ref"] = `A1:D500`;

    const columnWidths = [
      { wch: 10 },
      { wch: 15 },
      { wch: 80 },
      { wch: 30 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    XLSX.writeFile(workbook, "Plantilla_FractalIS.xlsx");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-10 relative">
      {/* Resplandores de fondo */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* HEADER */}
      <header className="text-center space-y-4 relative z-10">
        <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-2 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
          <FileText size={36} />
        </div>
        <h1 className="text-3xl font-light uppercase tracking-widest text-white/95">
          Plantilla e Instrucciones
        </h1>
        <p className="text-xs text-white uppercase tracking-wider max-w-xl mx-auto mt-1">
          Estructura de datos y descarga de plantilla para el análisis
        </p>
      </header>

      {/* MAIN LAYOUT: GRID DE DOS COLUMNAS */}
      <div className="grid md:grid-cols-2 gap-8 relative z-10 max-w-5xl mx-auto">
        
        {/* DESCARGA DE EXCEL */}
        <div className="bg-[#2a2a2a]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">// Descargar Estructura Base</h2>
              <p className="text-xs text-white/40 mt-1">Obtén la hoja preconfigurada para ingresar tus registros de diálogo.</p>
            </div>
            
            <button
              onClick={descargarTemplate}
              className="w-full bg-[#1a1a1a]/85 hover:bg-[#1a1a1a] text-white border border-white/15 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-95"
            >
              <Download size={18} className="text-blue-400" />
              Descargar Excel (.xlsx)
            </button>
          </div>
          
          <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl items-start">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h4 className="text-amber-500 font-bold text-xs uppercase tracking-wider">Restricción Crítica</h4>
              <p className="text-white/60 text-[10px] leading-relaxed">
                Las iniciales de la columna <strong>Participante</strong> deben coincidir exactamente con las registradas al crear el espacio.
              </p>
            </div>
          </div>
        </div>

        {/* GUÍA DE COLUMNAS */}
        <div className="bg-[#2a2a2a]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
          <div>
            <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">// Estructura de Columnas</h2>
            <p className="text-xs text-white/40 mt-1">El analizador requiere las siguientes columnas obligatorias:</p>
          </div>

          <div className="space-y-3">
            {[
              { num: "01", label: "Ronda", desc: "Número entero secuencial que agrupa las intervenciones." },
              { num: "02", label: "Participante", desc: "Código de iniciales registrado para el integrante." },
              { num: "03", label: "Contenido", desc: "El texto completo de la intervención del ponente." },
              { num: "04", label: "Timestamp", desc: "Fecha y hora en formato serial o estandarizado.", tag: "DD-MM-YYYY  HH:mm:ss" }
            ].map((col) => (
              <div key={col.num} className="flex gap-4 p-3 bg-[#131313]/60 border border-white/5 rounded-xl transition-all hover:border-white/10 hover:bg-[#131313]/80">
                <div className="font-mono text-blue-400 font-bold text-xs shrink-0 mt-0.5">{col.num}</div>
                <div className="space-y-1">
                  <p className="text-white text-xs font-bold uppercase tracking-wider">{col.label}</p>
                  <p className="text-white/50 text-[10px] leading-relaxed">{col.desc}</p>
                  {col.tag && (
                    <span className="inline-block text-[9px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded mt-1.5 font-bold">
                      {col.tag}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SECCIÓN PASOS RÁPIDOS */}
          <div className="pt-5 border-t border-white/10 space-y-3">
            <h3 className="text-white/60 font-mono text-[10px] uppercase tracking-wider">Pasos recomendados</h3>
            <ul className="space-y-2.5">
              {[
                "Descarga la plantilla base preconfigurada.",
                "Pega tus datos respetando las 4 columnas.",
                "Crea el Espacio, asigna ponentes y sube el archivo."
              ].map((step, idx) => (
                <li key={idx} className="flex items-center gap-3 text-[11px] text-white/50">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}