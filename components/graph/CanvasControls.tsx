"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReactFlow, Node } from "reactflow";
import * as htmlToImage from "html-to-image";
import {
  Search, ZoomIn, ZoomOut, Focus,
  Download, Filter, Check, EyeOff, User, Lock
} from "lucide-react";
import { RELATION_COLORS } from "@/app/espacios/grafo/[id]/constants";

interface CanvasControlsProps {
  nodes: Node[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  relationTypeFilter: string[];
  setRelationTypeFilter: (filters: string[] | ((prev: string[]) => string[])) => void;
  selectedPerson: string | null;
  setSelectedPerson: (person: string | null) => void;
  personColors: Record<string, string>;
  isPlaying?: boolean;
  isCommunityLayoutOn?: boolean;
}

const FILTER_OPTIONS = [
  { id: "sinergia", name: "Sinergia", color: RELATION_COLORS.sinergia || "#2ecc71" },
  { id: "antagonismo", name: "Antagonismo", color: RELATION_COLORS.antagonismo || "#e74c3c" },
  { id: "causalidad", name: "Causalidad", color: RELATION_COLORS.causalidad || "#9b59b6" },
  { id: "dependencia", name: "Dependencia", color: RELATION_COLORS.dependencia || "#e67e22" },
  { id: "consecuencia", name: "Consecuencia", color: RELATION_COLORS.consecuencia || "#e84393" },
  { id: "ejemplificacion", name: "Ejemplificación", color: RELATION_COLORS.ejemplificacion || "#f1c40f" },
];

export const CanvasControls = ({
  nodes,
  selectedNodeId,
  setSelectedNodeId,
  relationTypeFilter,
  setRelationTypeFilter,
  selectedPerson,
  setSelectedPerson,
  personColors,
  isPlaying = false,
  isCommunityLayoutOn = false,
}: CanvasControlsProps) => {
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const personFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as any;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
      if (personFilterRef.current && !personFilterRef.current.contains(target)) {
        setIsPersonFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrar sugerencias
  const suggestions = searchQuery.trim()
    ? nodes.filter(n =>
      n.data?.label?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const handleSelectSuggestion = (node: Node) => {
    setSelectedNodeId(node.id);
    setSearchQuery(node.data?.label || "");
    setShowSuggestions(false);

    // Centrar la cámara
    if (node.position) {
      setCenter(node.position.x, node.position.y, { zoom: 2.0, duration: 800 });
    }
  };

  const handleClearSelection = () => {
    setSelectedNodeId(null);
    setSearchQuery("");
  };

  const handleToggleFilter = (filterId: string) => {
    setRelationTypeFilter((prev) =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleResetView = () => {
    setSelectedNodeId(null);
    setSelectedPerson(null);
    setSearchQuery("");
    fitView({ duration: 800, padding: 0.2 });
  };

  const handleExportPng = () => {
    const flowContainer = document.querySelector(".react-flow__renderer") as HTMLElement;
    if (!flowContainer) return;

    setIsExporting(true);

    htmlToImage
      .toPng(flowContainer, {
        backgroundColor: "#0d0d0d",
        style: {
          transform: "scale(1)",
        },
      })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `grafo-dialogo-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error("Fallo al exportar el lienzo:", error);
      })
      .finally(() => {
        setIsExporting(false);
      });
  };

  return (
    <div className="relative w-full max-w-4xl">
      {/* Indicador de bloqueo flotante */}
      {(isPlaying || isCommunityLayoutOn) && (
        <div className="absolute -top-3 left-6 z-50 bg-[#ff9f43]/90 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-[#ff9f43]">
          <Lock className="w-2.5 h-2.5" />
          <span>Controles bloqueados {isCommunityLayoutOn ? "en modo Comunidad" : "en reproducción"}</span>
        </div>
      )}

      <div
        className={`bg-[#111]/90 backdrop-blur-2xl p-3 px-5 rounded-[24px] border border-white/10 flex flex-col md:flex-row items-center gap-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] w-full transition-all duration-500 ${(isPlaying || isCommunityLayoutOn) ? "opacity-30 pointer-events-none select-none border-white/5" : ""
          }`}
      >
        {/* 1. AUTOCOMPLETE DE BÚSQUEDA DE CONCEPTOS */}
        <div ref={searchRef} className="relative w-full md:w-64 shrink-0 z-50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-black/50 border border-white/5 rounded-xl pl-9 pr-8 py-2 text-[11px] focus:outline-none focus:border-[#1e90ff]/40 focus:ring-1 focus:ring-[#1e90ff]/40 transition-all text-white font-medium placeholder-white/20"
            />
            {searchQuery && (
              <button
                onClick={handleClearSelection}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-[9px] uppercase font-mono tracking-widest px-1 py-0.5 rounded hover:bg-white/5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sugerencias desplegables */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar p-2">
              {suggestions.map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleSelectSuggestion(node)}
                  className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/5 text-[11px] font-semibold text-white/90 hover:text-white transition-all truncate flex items-center justify-between"
                >
                  <span>{node.data?.label}</span>
                  <span className="text-[8px] font-mono opacity-30">Concept</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. FILTRO POR PERSONA (PARTICIPANTE) */}
        <div ref={personFilterRef} className="relative shrink-0 z-40">
          <button
            onClick={() => {
              setIsPersonFilterOpen(!isPersonFilterOpen);
              setIsFilterOpen(false);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/50 border border-white/5 hover:border-white/15 transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer ${selectedPerson ? "text-[#1e90ff] border-[#1e90ff]/20" : "text-gray-400 hover:text-white"
              }`}
          >
            <User className="w-3 h-3" />
            <span className="max-w-[100px] truncate">
              {selectedPerson ? `Autor: ${selectedPerson}` : "Filtrar Persona"}
            </span>
          </button>

          {isPersonFilterOpen && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-[#141414] border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-2">
              <span className="text-[9px] uppercase font-mono text-white/30 tracking-[0.2em] mb-1">Filtrar por Persona</span>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => {
                    setSelectedPerson(null);
                    setIsPersonFilterOpen(false);
                  }}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-white/5 text-[11px] font-semibold text-white/80 hover:text-white transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <span>Todos los participantes</span>
                  </div>
                  {!selectedPerson && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>

                {Object.keys(personColors).map((name) => {
                  const color = personColors[name] || "#57606f";
                  const isSelected = selectedPerson === name;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        setSelectedPerson(name);
                        setIsPersonFilterOpen(false);
                      }}
                      className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-white/5 text-[11px] font-semibold text-white/80 hover:text-white transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="truncate max-w-[150px]">{name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. FILTROS DE RELACIONES */}
        <div ref={filterRef} className="relative shrink-0 z-40">
          <button
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsPersonFilterOpen(false);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/50 border border-white/5 hover:border-white/15 transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer ${relationTypeFilter.length < FILTER_OPTIONS.length ? "text-orange-400" : "text-gray-400 hover:text-white"
              }`}
          >
            <Filter className="w-3 h-3" />
            <span>Relaciones ({relationTypeFilter.length})</span>
          </button>

          {isFilterOpen && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-[#141414] border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-2">
              <span className="text-[9px] uppercase font-mono text-white/30 tracking-[0.2em] mb-1">Filtrar Relaciones</span>
              <div className="flex flex-col gap-1.5">
                {FILTER_OPTIONS.map((opt) => {
                  const isActive = relationTypeFilter.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleToggleFilter(opt.id)}
                      className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-white/5 text-[11px] font-semibold text-white/80 hover:text-white transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                        <span>{opt.name}</span>
                      </div>
                      {isActive ? (
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-white/20" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. CONTROLES DE ZOOM / LIENZO */}
        <div className="flex items-center gap-1.5 border-l border-white/10 pl-4 w-full justify-between md:justify-end md:w-auto ml-auto">
          <button
            onClick={() => zoomIn()}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            title="Acercar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => zoomOut()}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            title="Alejar Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            title="Centrar / Restablecer Vista"
          >
            <Focus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Exportar Mapa como PNG"
          >
            {isExporting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1e90ff; }
      `}</style>
    </div>
  );
};
