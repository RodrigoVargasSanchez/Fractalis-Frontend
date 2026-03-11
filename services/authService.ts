const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authService = {
  login: async (usuarioNombre: string, clave: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioNombre, clave }),
    });

    if (!response.ok) {
      throw new Error("Credenciales inválidas");
    }

    const data = await response.json();
    
    // Guardar el JWT en localStorage (o cookies para mayor seguridad)
    if (data.token) {
      localStorage.setItem("fractalis_token", data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem("fractalis_token");
    window.location.href = "/login";
  },

  getToken: () => {
    return typeof window !== "undefined" ? localStorage.getItem("fractalis_token") : null;
  }
};