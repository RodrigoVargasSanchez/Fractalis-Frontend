// services/authService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

export const authService = {
  login: async (usuarioNombre: string, clave: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioNombre, clave }),
    });

    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }

    const data = await response.json();
    
    if (data.token) {
      // Usamos un bloque try-catch por si el navegador tiene deshabilitado el localStorage
      try {
        // Guardamos con la clave única que definimos
        localStorage.setItem("fractalis_token", data.token);
      } catch (e) {
        console.warn("No se pudo guardar en localStorage:", e);
      }
      
      // GUARDAR EN COOKIE: Vital para el middleware de Next.js
      document.cookie = `fractalis_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
    return data;
  },

  logout: () => {
    // Limpieza total de rastros de autenticación
    if (typeof window !== "undefined") {
      localStorage.removeItem("fractalis_token");
      // Borramos la cookie expirándola
      document.cookie = "fractalis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
  },

  /**
   * Este es el método que ahora usan todos tus otros servicios
   * (espaciosService, grafoService, fetchGraphQL)
   */
  getToken: () => {
    return typeof window !== "undefined" ? localStorage.getItem("fractalis_token") : null;
  }
};