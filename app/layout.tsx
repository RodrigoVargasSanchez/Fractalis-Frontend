"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import GraphBackground from "@/components/GraphBackground";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Determinamos si es la página de login o la raíz pública
  const isPublicPage = pathname === "/login" || pathname === "/";

  useEffect(() => {
    // Definimos títulos descriptivos según la ruta
    const titles: Record<string, string> = {
      "/": "Fractalis",
      "/login": "Iniciar Sesión - Fractalis",
      "/espacios": "Mis Espacios - Fractalis",
      "/nuevo": "Nuevo Espacio - Fractalis",
      "/nuevo/subir-archivo": "Subir Archivo - Fractalis",
      "/instrucciones": "Instrucciones de Uso - Fractalis",
      "/admin/usuarios": "Administración de Usuarios - Fractalis",
    };

    if (titles[pathname]) {
      document.title = titles[pathname];
    } else if (pathname.startsWith("/espacios/ver/")) {
      document.title = "Detalles del Espacio - Fractalis";
    } else if (pathname.startsWith("/espacios/editar/")) {
      document.title = "Editar Espacio - Fractalis";
    } else if (pathname.startsWith("/espacios/grafo/")) {
      document.title = "Grafo Evolutivo - Fractalis";
    } else {
      document.title = "Fractalis";
    }
  }, [pathname]);

  return (
    <html lang="es">
      <body className="bg-[#222222] text-white antialiased relative overflow-hidden">
        {/* Fondo Interactivo de Grafos y Nodos Global */}
        <GraphBackground />

        <div className="relative flex h-screen overflow-hidden z-10">
          {/* Solo mostramos el Sidebar si NO es una página pública */}
          {!isPublicPage && <Sidebar />}

          {/* Área de contenido principal */}
          <main className="flex-1 p-10 overflow-y-auto custom-scrollbar relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}