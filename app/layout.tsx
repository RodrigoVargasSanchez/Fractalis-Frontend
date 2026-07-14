"use client";

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