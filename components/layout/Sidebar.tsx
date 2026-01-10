"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// --- Constantes (UPPER_CASE) ---
// Se saca del componente por ser una configuración estática
const MENU_ITEMS = [
  { name: "Mis Espacios", href: "/espacios" },
  { name: "Crear Nuevo", href: "/nuevo" },
];

// --- Componente Principal (PascalCase) ---
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-48 flex-col justify-between border-e border-[#1e7a9c] bg-[#ff947d] text-white">
      <div className="px-4 py-6">
        
        {/* LOGO / BRANDING */}
        <div className="flex flex-col items-start px-2 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Fractal-IS</h1>
          <p className="text-sm font-light opacity-90 italic">Diálogo</p>
        </div>

        {/* NAVEGACIÓN */}
        <nav aria-label="Main Navigation">
          <ul className="mt-6 space-y-2">
            {MENU_ITEMS.map((menuItem) => {
              // Lógica de estado activo (camelCase)
              const isActive = pathname.startsWith(menuItem.href);

              return (
                <li key={menuItem.href}>
                  <Link
                    href={menuItem.href}
                    className={cn(
                      "block w-full rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white/20 shadow-inner text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {menuItem.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* PERFIL DE USUARIO (FOOTER SIDEBAR) */}
      <footer className="border-t border-white/20 p-4 bg-[#1e7a9c]/30">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40"
            alt="Profile avatar"
            className="size-10 rounded-full object-cover border border-white/30 shadow-sm"
          />
          <div className="text-xs truncate">
            <p className="font-semibold truncate">Nombre de usuario</p>
            <p className="text-white/70 truncate">correo@ejemplo.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}