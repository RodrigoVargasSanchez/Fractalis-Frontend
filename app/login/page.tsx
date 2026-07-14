"use client";

import { useState } from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GraphBackground from "@/components/GraphBackground";
import { User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authService.login(usuario, clave);
      router.push("/espacios"); // Redirigir a la página principal tras login
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#222222] text-white overflow-hidden font-sans">
      {/* Fondo Interactivo de Grafos y Nodos */}
      <GraphBackground />

      {/* Efecto de resplandor ambiental en el fondo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Contenedor de la Tarjeta de Login */}
      <div className="relative z-10 w-full max-w-md p-8 bg-[#2a2a2a]/70 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transition-all duration-500 hover:border-white/15">
        <div className="flex justify-center mb-8 transition-transform duration-300 hover:scale-105">
          {/* Logo del proyecto con prioridad */}
          <Image
            src="/logofractalis.png"
            alt="Fractalis"
            width={180}
            height={60}
            priority
            className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          />
        </div>

        <h2 className="text-xl font-light text-center mb-8 uppercase tracking-widest text-white/95">
          Iniciar Sesión
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Usuario */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Usuario
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                className="w-full pl-11 pr-4 py-3 bg-[#1a1a1a]/85 border border-white/15 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Contraseña
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                className="w-full pl-11 pr-11 py-3 bg-[#1a1a1a]/85 border border-white/15 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-pulse">
              <AlertCircle size={16} className="shrink-0" />
              <p className="leading-tight">{error}</p>
            </div>
          )}

          {/* Botón de Entrada */}
          <button
            type="submit"
            disabled={isLoading}
            className="relative overflow-hidden w-full py-3.5 bg-white text-black font-bold uppercase tracking-wider text-sm rounded-xl transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Conectando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>

      {/* Footer Tecnológico Sutil */}
      <div className="relative z-10 mt-8 text-white/30 text-xs tracking-widest uppercase">
        Fractalis &copy; {new Date().getFullYear()} // Conexión Segura
      </div>
    </div>
  );
}