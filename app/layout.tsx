"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
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
      {/* Mantenemos tus clases originales de fondo y suavizado de fuente */}
      <body className="bg-[#222222] text-white antialiased">
        <div className="flex h-screen overflow-hidden">
          
          {/* Solo mostramos el Sidebar si NO es una página pública */}
          {!isPublicPage && <Sidebar />}

          {/* Área de contenido principal:
              1. Mantenemos p-10, overflow y tu scrollbar personalizada.
              2. Eliminamos márgenes manuales; el Sidebar al ser parte del flex 
                 empujará el contenido automáticamente si no es fijo.
          */}
          <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}