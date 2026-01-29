"use client";

import React, { useState, ChangeEvent } from 'react';

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
        className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-800 bg-[#121212] p-10 text-center transition-all hover:border-[#2596be]/50 hover:bg-[#2596be]/5"
      >
        <div className="mb-6 transform transition-transform group-hover:scale-110 duration-500">
          <img 
            src="/archivo-subir.png" 
            alt="Excel Icon"
            className="w-24 h-24 object-contain opacity-80 group-hover:opacity-100" 
          />
        </div>

        <div className="space-y-2">
          <p className="font-bold text-lg text-white">
            {fileCount > 0 
              ? `${fileCount} archivo(s) listos` 
              : label
            }
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Formatos admitidos: Excel (.xlsx, .xls)
          </p>
        </div>

        <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1a1a1a] px-5 py-2.5 text-xs font-bold text-gray-300 border border-white/5 transition-all group-hover:bg-[#2596be] group-hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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