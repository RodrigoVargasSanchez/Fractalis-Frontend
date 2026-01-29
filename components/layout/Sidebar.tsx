"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LayoutGrid, PlusCircle } from "lucide-react";

const MENU_ITEMS = [
  { name: "Mis Espacios", href: "/espacios", icon: LayoutGrid },
  { name: "Crear Nuevo", href: "/nuevo", icon: PlusCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div 
      className={cn(
        "relative flex h-screen flex-col justify-between border-e border-[#1e7a9c] bg-[#ff947d] text-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* BOTÓN DE TOGGLE (FLOTANTE EN EL BORDE) */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-10 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-[#1e7a9c] bg-[#ff947d] text-white shadow-md hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="px-4 py-6 overflow-hidden">
        {/* LOGO / BRANDING */}
        <div className={cn(
          "flex flex-col items-start px-2 mb-8 transition-opacity duration-300",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}>
          <h1 className="text-2xl font-bold tracking-tight whitespace-nowrap">Fractal-IS</h1>
          <p className="text-sm font-light opacity-90 italic whitespace-nowrap">Diálogo</p>
        </div>

        {/* NAVEGACIÓN */}
        <nav aria-label="Main Navigation">
          <ul className="mt-6 space-y-2">
            {MENU_ITEMS.map((menuItem) => {
              const isActive = pathname.startsWith(menuItem.href);
              const Icon = menuItem.icon;

              return (
                <li key={menuItem.href}>
                  <Link
                    href={menuItem.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white/20 shadow-inner text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? menuItem.name : ""}
                  >
                    <Icon className="size-5 shrink-0" />
                    {!isCollapsed && (
                      <span className="transition-opacity duration-300 whitespace-nowrap">
                        {menuItem.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* PERFIL DE USUARIO */}
      <footer className="border-t border-white/20 p-4 bg-[#1e7a9c]/30">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <img
            src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40"
            alt="Profile avatar"
            className="size-10 shrink-0 rounded-full object-cover border border-white/30 shadow-sm"
          />
          {!isCollapsed && (
            <div className="text-xs truncate transition-opacity duration-300">
              <p className="font-semibold truncate">Nombre de usuario</p>
              <p className="text-white/70 truncate">correo@ejemplo.com</p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}