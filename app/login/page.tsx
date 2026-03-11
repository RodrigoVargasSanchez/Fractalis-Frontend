"use client";
import { useState } from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.login(usuario, clave);
      router.push("/espacios"); // Redirigir a la página principal tras login
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#222222] text-white">
      <div className="w-full max-w-md p-8 bg-[#2a2a2a] rounded-xl shadow-2xl border border-white/10">
        <div className="flex justify-center mb-8">
          {/* Usando el logo del proyecto */}
          <Image src="/logofractalis.png" alt="Fractalis" width={180} height={60} priority />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Usuario</label>
            <input
              type="text"
              className="w-full p-3 bg-[#1a1a1a] border border-white/20 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <input
              type="password"
              className="w-full p-3 bg-[#1a1a1a] border border-white/20 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-transform active:scale-95"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}