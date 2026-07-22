"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LayoutGrid, PlusCircle, FileText, Users, LogOut } from "lucide-react";
import { authService } from "@/services/authService";

const MENU_ITEMS = [
  { name: "Mis Espacios", href: "/espacios", icon: LayoutGrid },
  { name: "Crear Nuevo", href: "/nuevo", icon: PlusCircle },
  { name: "Plantilla e Instrucciones", href: "/instrucciones", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Obtener la sesión del usuario para comprobar su rol (solo tras montarse en el cliente)
  const user = mounted ? authService.getSessionUser() : null;
  const isAdmin = user?.rol === "admin";

  // Construir dinámicamente las opciones del menú
  const menuItems = [
    { name: "Mis Espacios", href: "/espacios", icon: LayoutGrid },
    ...(isAdmin ? [
      { name: "Crear Nuevo", href: "/nuevo", icon: PlusCircle },
      { name: "Gestión de Usuarios", href: "/admin/usuarios", icon: Users }
    ] : []),
    { name: "Plantilla e Instrucciones", href: "/instrucciones", icon: FileText },
  ];

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col justify-between border-e border-[#ff8066]/40 bg-gradient-to-b from-[#ff947d] to-[#ff8066] text-white transition-all duration-300 ease-in-out z-20 shadow-[5px_0_30px_rgba(0,0,0,0.15)]",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* BOTÓN DE TOGGLE (FLOTANTE EN EL BORDE) */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-10 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-[#ff8066]/50 bg-[#ff947d] text-white shadow-md hover:bg-white hover:text-[#ff947d] hover:scale-110 transition-all duration-300 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="px-4 py-6 overflow-hidden">
        {/* LOGO / BRANDING */}
        {!isCollapsed ? (
          <div className="flex flex-col items-start px-2 mb-8 transition-opacity duration-300">
            <img 
              src="/logofractalis.png" 
              alt="Fractalis" 
              className="h-auto w-40 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-300 hover:scale-105 cursor-pointer"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mb-8 h-12 w-full text-white">
            <img 
              src="/logofractalis.png" 
              alt="Fractalis" 
              className="h-10 w-10 object-cover object-left transition-transform duration-300 hover:scale-110 cursor-pointer rounded-lg border border-white/5 shadow-inner"
            />
          </div>
        )}

        {/* NAVEGACIÓN */}
        <nav aria-label="Main Navigation">
          <ul className="mt-6 space-y-2">
            {menuItems.map((menuItem) => {
              const isActive = pathname.startsWith(menuItem.href);
              const Icon = menuItem.icon;

              return (
                <li key={menuItem.href}>
                  <Link
                    href={menuItem.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 border border-transparent",
                      isActive
                        ? "bg-white/20 text-white font-bold border-l-2 border-l-white border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
                        : "text-white/70 hover:text-white hover:bg-white/10 hover:border-white/5",
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

      {/* SECCIÓN INFERIOR: CERRAR SESIÓN */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <button
          onClick={() => authService.logout()}
          className={cn(
            "flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Cerrar Sesión" : ""}
        >
          <LogOut className="size-5 shrink-0" />
          {!isCollapsed && (
            <span className="transition-opacity duration-300 whitespace-nowrap">
              Cerrar Sesión
            </span>
          )}
        </button>
      </div>
    </div>
  );
}