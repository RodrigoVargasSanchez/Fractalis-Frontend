"use client";

import React from "react";
import * as XLSX from "xlsx";
import { Download, FileText, Info, AlertCircle, CheckCircle2 } from "lucide-react";

export default function InstruccionesPage() {
  
const descargarTemplate = () => {
  const workbook = XLSX.utils.book_new();

  // 1. Definimos los datos de ejemplo (2 filas con distintos participantes)
  // Los números representan la fecha y hora en formato serial de Excel
  const data = [
    {
      Ronda: "1",
      Participante: "RS",
      Contenido: "Ejemplo de intervención: Escriba aquí el texto de la conversación.",
      Timestamp: 45662.7916666667 // 05-01-2025 19:00:00
    },
    {
      Ronda: "1",
      Participante: "JP",
      Contenido: "Respuesta de ejemplo: El segundo participante aporta información adicional.",
      Timestamp: 45662.7951388889 // 05-01-2025 19:05:00 (5 minutos después)
    }
  ];

  // 2. Convertimos a hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 3. PRE-CONFIGURAR TODA LA COLUMNA D (Timestamp)
  // Aplicamos el formato a las filas de ejemplo y a las vacías hasta la 500
  const formatoTimestamp = 'dd-mm-yyyy"  "hh:mm:ss';
  
  for (let i = 2; i <= 500; i++) {
    const cellAddress = `D${i}`;
    
    if (!worksheet[cellAddress]) {
      // Si la celda está vacía, creamos el objeto para que guarde el formato
      worksheet[cellAddress] = { t: 'n', v: undefined, z: formatoTimestamp };
    } else {
      // Si ya tiene datos (D2 y D3), forzamos el tipo número y el formato
      worksheet[cellAddress].t = 'n';
      worksheet[cellAddress].z = formatoTimestamp;
    }
  }

  // 4. Forzamos el rango de la hoja para que Excel "vea" las celdas pre-formateadas
  worksheet["!ref"] = `A1:D500`;

  // 5. Ajuste de anchos de columna para que el contenido sea legible
  const columnWidths = [
    { wch: 10 }, // Ronda
    { wch: 15 }, // Participante
    { wch: 80 }, // Contenido (más ancho para los textos largos)
    { wch: 30 }, // Timestamp
  ];
  worksheet["!cols"] = columnWidths;

  // 6. Añadir la hoja al libro y descargar
  XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
  XLSX.writeFile(workbook, "Plantilla_FractalIS.xlsx");
};

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <header className="text-center space-y-4">
        <div className="inline-flex p-3 bg-[#2596be]/10 rounded-2xl text-[#2596be] mb-2">
          <FileText size={40} />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Instrucciones de Carga
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Para que la Inteligencia Artificial analice correctamente las conversaciones, 
          el archivo debe seguir una estructura específica.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: BOTÓN Y ALERTAS */}
        <div className="space-y-6">
          <div className="bg-[#333333] border border-gray-700 p-8 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Download className="text-[#2596be]" /> Descargar Plantilla
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Haz clic en el botón de abajo para obtener el archivo Excel con el formato 
              preconfigurado listo para rellenar.
            </p>
            <button
              onClick={descargarTemplate}
              className="w-full bg-[#2596be] hover:bg-[#1e7a9c] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
            >
              Descargar Excel (.xlsx)
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex gap-4">
            <AlertCircle className="text-amber-500 shrink-0" />
            <div>
              <h4 className="text-amber-500 font-bold text-sm">Importante</h4>
              <p className="text-amber-200/70 text-xs mt-1">
                El sistema no aceptará archivos con columnas faltantes o nombres de 
                participantes que no coincidan con las iniciales registradas.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: GUÍA VISUAL Y PASOS */}
        <div className="bg-[#333333] border border-gray-700 p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="text-[#2596be]" /> Formato de Columnas
          </h2>
          
          <div className="space-y-4">
            {/* RONDA */}
            <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="font-mono text-[#2596be] font-bold text-lg">01</div>
              <div>
                <p className="text-white font-bold text-sm uppercase">Ronda</p>
                <p className="text-gray-400 text-xs">Indica el número de la ronda o momento en que se produjo la intervención.</p>
              </div>
            </div>

            {/* PARTICIPANTE */}
            <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="font-mono text-[#2596be] font-bold text-lg">02</div>
              <div>
                <p className="text-white font-bold text-sm uppercase">Participante</p>
                <p className="text-gray-400 text-xs">
                  Debe usar las <span className="text-white font-bold underline">iniciales</span> designadas al seleccionar los participantes.
                </p>
              </div>
            </div>

            {/* CONTENIDO */}
            <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="font-mono text-[#2596be] font-bold text-lg">03</div>
              <div>
                <p className="text-white font-bold text-sm uppercase">Contenido</p>
                <p className="text-gray-400 text-xs">El texto o mensaje íntegro de la conversación.</p>
              </div>
            </div>

            {/* TIMESTAMP */}
            <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
              <div className="font-mono text-[#2596be] font-bold text-lg">04</div>
              <div>
                <p className="text-white font-bold text-sm uppercase">Timestamp</p>
                <p className="text-amber-400 font-mono text-[11px] mt-1 bg-amber-400/10 p-1 rounded">
                  DD-MM-YYYY &nbsp;&nbsp; HH:mm:ss
                </p>
                <p className="text-gray-400 text-[10px] mt-1">
                  * Obligatorio: <span className="text-white font-bold italic text-xs underline">Dos espacios</span> entre la fecha y la hora.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN REINTEGRADA: PASOS A SEGUIR */}
          <div className="pt-6 border-t border-gray-700">
            <h3 className="text-white font-bold text-sm mb-4">Pasos a seguir:</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-xs text-gray-400">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" /> 
                <span>Descarga la <strong>Plantilla Excel</strong> desde esta página.</span>
              </li>
              <li className="flex items-center gap-3 text-xs text-gray-400">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" /> 
                <span>Pega tus datos respetando los encabezados y el formato de fecha.</span>
              </li>
              <li className="flex items-center gap-3 text-xs text-gray-400">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" /> 
                <span>Ve a la sección <strong>"Crear Nuevo"</strong>, completa los detalles y sube el archivo.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}