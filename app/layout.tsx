// app/layout.tsx
import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fractal-IS | Diálogo",
  description: "Gestión de espacios y análisis comunitario",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#222222] text-white antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Barra lateral fija */}
          <Sidebar />

          {/* Área de contenido principal */}
          <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}