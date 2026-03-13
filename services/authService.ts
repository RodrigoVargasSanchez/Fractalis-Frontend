// services/authService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authService = {
  login: async (usuarioNombre: string, clave: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioNombre, clave }),
    });

    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }

    const data = await response.json();
    
    if (data.token) {
      // Guardamos en localStorage para persistencia en el cliente
      localStorage.setItem("fractalis_token", data.token);
      
      // GUARDAR EN COOKIE: Esto es vital para que el middleware funcione
      // Definimos la cookie con una duración (ej. 7 días) y ruta raíz
      document.cookie = `fractalis_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem("fractalis_token");
    // Borramos la cookie
    document.cookie = "fractalis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/login";
  },

  getToken: () => {
    return typeof window !== "undefined" ? localStorage.getItem("fractalis_token") : null;
  }
};