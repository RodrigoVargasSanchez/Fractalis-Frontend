"use client";

import React, { useState, ChangeEvent, FC } from 'react';

interface FileUploadProps {
  label?: string;
  buttonText?: string;
  multiple?: boolean;
  accept?: string;
  onFilesSelected?: (files: FileList | null) => void;
}

export default function FileUpload({
  label = "Sube tu archivo(s)",
  buttonText = "Explorar archivos",
  multiple = true,
  accept = "*",
  onFilesSelected
}: FileUploadProps) {
  
  // --- Estado ---
  const [fileCount, setFileCount] = useState(0);

  // --- Handlers ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const count = files ? files.length : 0;
    
    setFileCount(count);
    
    if (onFilesSelected) {
      onFilesSelected(files);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <label 
        htmlFor="File" 
        className="flex cursor-pointer flex-col items-center rounded border border-gray-300 p-4 text-gray-900 shadow-sm transition-all hover:bg-gray-50 sm:p-6"
      >
        {/* Imagen / Icono */}
        <img 
          src="/archivo.png" 
          alt="Icono de archivo"
          className="object-contain" 
          style={{ width: '120px', height: '120px', minWidth: '120px' }}
        />

        {/* Texto Dinámico */}
        <span className="mt-4 font-medium text-sm sm:text-base">
          {fileCount > 0 
            ? `${fileCount} archivo(s) seleccionados` 
            : label
          }
        </span>

        {/* Botón Estilizado */}
        <span className="mt-2 inline-block rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 transition-colors">
          {buttonText}
        </span>

        {/* Input Oculto */}
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