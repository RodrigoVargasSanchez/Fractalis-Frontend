"use client";

import React, { useState, ChangeEvent } from 'react';
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label?: string;
  buttonText?: string;
  multiple?: boolean;
  accept?: string;
  onFilesSelected?: (files: FileList | null) => void;
}

export default function FileUpload({
  label = "Sube tu archivo",
  buttonText = "Seleccionar desde el equipo",
  multiple = true,
  accept = "*",
  onFilesSelected
}: FileUploadProps) {

  const [fileCount, setFileCount] = useState(0);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setFileCount(files ? files.length : 0);
    if (onFilesSelected) onFilesSelected(files);
  };

  return (
    <div className="w-full">
      <label
        htmlFor="File"
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center",
          "rounded-lg border border-dashed border-white/10 bg-[#0a0a0a]",
          "p-12 text-center transition-all duration-300",
          "hover:border-[#2596be]/40 hover:bg-[#2596be]/5 hover:shadow-[0_0_20px_rgba(37,150,190,0.05)]"
        )}
      >
        {/* Icono con estética técnica */}
        <div className="mb-6 transform transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(37,150,190,0.3)]">
          <img
            src="/archivo-subir.png"
            alt="Excel Icon"
            className="w-20 h-20 object-contain opacity-40 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all"
          />
        </div>

        <div className="space-y-3">
          <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-gray-500 group-hover:text-gray-300 transition-colors">
            {fileCount > 0
              ? `// ${fileCount} archivo(s) detectado(s)`
              : `// ${label}`
            }
          </p>
          <p className="text-[10px] text-gray-600 font-mono tracking-tighter">
            SYSTEM_ACCEPT: [EXCEL_.XLSX, .XLS]
          </p>
        </div>

        {/* Botón estilo terminal */}
        <span className={cn(
          "mt-8 inline-flex items-center gap-2 rounded border border-white/5 bg-[#121212]",
          "px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400",
          "transition-all group-hover:border-[#2596be] group-hover:text-[#2596be] group-hover:bg-[#2596be]/10"
        )}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          {buttonText}
        </span>

        <input
          id="File"
          type="file"
          className="sr-only"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}