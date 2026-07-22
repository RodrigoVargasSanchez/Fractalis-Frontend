"use client";

import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { User, Lock, Mail, CheckCircle, AlertCircle, Edit, Trash2, X, Shield, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

interface UserDB {
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  rol: string;
}

export default function RegistrarUsuarioPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rol, setRol] = useState("usuario");
  
  const [usuarios, setUsuarios] = useState<UserDB[]>([]);
  const [editingUser, setEditingUser] = useState<UserDB | null>(null);
  const [viewingUser, setViewingUser] = useState<UserDB | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const currentUserId = authService.getSessionUser()?.usuarioId;

  const fetchUsuarios = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsuarios(data);
      } else {
        setError(data.message || "Error al cargar usuarios.");
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("Error de conexión al cargar usuarios.");
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleEditClick = (user: UserDB) => {
    setEditingUser(user);
    setNombre(user.usuario_nombre);
    setEmail(user.usuario_email);
    setPassword("");
    setConfirmPassword("");
    setRol(user.rol);
    setError("");
    setSuccess(false);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNombre("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRol("usuario");
    setError("");
    setSuccess(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      return;
    }
    setError("");
    setSuccess(false);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_URL}/api/admin/usuarios/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar el usuario.");
      }
      setSuccess(true);
      setSuccessMessage("¡USUARIO ELIMINADO EXITOSAMENTE!");
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el usuario.");
      alert(err.message || "No se pudo eliminar el usuario.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validaciones básicas de cliente
    if (!nombre.trim() || !email.trim() || !rol) {
      setError("Todos los campos básicos son obligatorios.");
      return;
    }

    if (!editingUser && !password) {
      setError("La contraseña es requerida para nuevos usuarios.");
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const token = authService.getToken();
      
      const endpoint = editingUser 
        ? `${API_URL}/api/admin/usuarios/${editingUser.usuario_id}`
        : `${API_URL}/api/admin/usuarios`;

      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password: password ? password : undefined,
          rol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error al ${editingUser ? 'editar' : 'registrar'} el usuario.`);
      }

      setSuccess(true);
      setSuccessMessage(editingUser ? "¡USUARIO ACTUALIZADO EXITOSAMENTE!" : "¡USUARIO CREADO EXITOSAMENTE!");
      
      // Limpiar formulario y modo edición
      setNombre("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRol("usuario");
      setEditingUser(null);
      
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "Hubo un problema al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = "w-full pl-11 pr-4 py-3 bg-[#1a1a1a]/85 border border-white/15 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] text-sm";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 relative">
      {/* Resplandores ambientales de fondo */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 space-y-8">
        {/* ENCABEZADO */}
        <header className="text-center space-y-4">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-2 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            <User size={36} />
          </div>
          <h1 className="text-3xl font-light uppercase tracking-widest text-white/95">
            Gestión de Usuarios
          </h1>
          <p className="text-xs text-white uppercase tracking-wider mt-1">
            Administración, registro y edición de credenciales de acceso
          </p>
        </header>

        {/* CONTENEDOR PRINCIPAL: GRID DE DOS COLUMNAS */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-2xl blur-lg opacity-75 transition duration-1000 group-hover:opacity-100"></div>
            
            <form 
              onSubmit={handleSubmit}
              className="relative space-y-5 bg-[#2a2a2a]/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                  {editingUser ? `// Editar Integrante` : `// Registrar Integrante`}
                </h3>
                {editingUser && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 text-white/40 hover:text-white bg-white/5 border border-white/10 rounded transition-all cursor-pointer flex items-center gap-1 text-[9px] font-mono uppercase"
                  >
                    <X size={10} /> Cancelar
                  </button>
                )}
              </div>

              {/* Campo Nombre */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold text-white/40 uppercase ml-1">
                  Nombre de Usuario
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Ej: Roberto Gómez"
                    className={inputBase}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Campo Correo */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold text-white/40 uppercase ml-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    placeholder="Ej: roberto@fractalis.cl"
                    className={inputBase}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Campo Rol */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold text-white/40 uppercase ml-1">
                  Rol del Usuario
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                    <Shield size={18} />
                  </span>
                  <select
                    className={cn(inputBase, "appearance-none pr-10 cursor-pointer")}
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="usuario" className="bg-[#2a2a2a] text-white">Usuario Estándar</option>
                    <option value="admin" className="bg-[#2a2a2a] text-white">Administrador</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold text-white/40 uppercase ml-1">
                  Contraseña {editingUser && "(Dejar en blanco para no cambiar)"}
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    placeholder={editingUser ? "Opcional" : "Mínimo 6 caracteres"}
                    className={inputBase}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required={!editingUser}
                  />
                </div>
              </div>

              {/* Campo Confirmar Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono font-bold text-white/40 uppercase ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    placeholder="Repita la contraseña"
                    className={inputBase}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required={!!password}
                  />
                </div>
              </div>

              {/* MENSAJES DE ESTADO */}
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-mono animate-in zoom-in-95 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="leading-normal">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-mono animate-in zoom-in-95 duration-200">
                  <CheckCircle className="w-4 h-4 shrink-0 animate-bounce" />
                  <span className="leading-normal">{successMessage}</span>
                </div>
              )}

              {/* BOTÓN DE ENVÍO */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "relative overflow-hidden w-full px-8 py-3.5 bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_25px_rgba(59,130,246,0.35)] active:scale-[0.98] cursor-pointer disabled:opacity-50",
                    isLoading && "animate-pulse"
                  )}
                >
                  {isLoading 
                    ? (editingUser ? "Actualizando..." : "Registrando...") 
                    : (editingUser ? "Guardar Cambios" : "Registrar Integrante")
                  }
                </button>
              </div>
            </form>
          </div>

          {/* COLUMNA DERECHA: LISTADO DE USUARIOS */}
          <div className="lg:col-span-7 bg-[#2a2a2a]/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">// Integrantes Registrados</h2>
                <p className="text-xs text-white/40 mt-1">Lista completa de credenciales activas en el sistema.</p>
              </div>

              {/* Barra de búsqueda */}
              <div className="relative group min-w-[220px]">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-8 py-2 bg-[#1a1a1a]/85 border border-white/15 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
              {usuarios
                .filter((u) =>
                  u.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.usuario_email.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((u) => {
                  const isSelf = u.usuario_id === currentUserId;
                  const isAdminRole = u.rol === "admin";
                  return (
                    <div
                      key={u.usuario_id}
                      className="flex items-center justify-between p-4 bg-[#131313]/60 border border-white/5 rounded-xl transition-all duration-300 hover:border-white/10 hover:bg-[#131313]/80 group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border font-mono font-bold text-sm",
                          isAdminRole 
                            ? "bg-red-500/10 border-red-500/30 text-red-400" 
                            : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        )}>
                          {u.usuario_nombre.substring(0, 2).toUpperCase()}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white uppercase tracking-wider leading-none">{u.usuario_nombre}</p>
                            {isSelf && (
                              <span className="text-[8px] font-mono bg-white/10 text-white/60 px-1.5 py-0.5 rounded uppercase leading-none font-bold">Tú</span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/40 font-mono leading-none">{u.usuario_email || 'Sin correo registrado'}</p>
                          
                          {/* Rol Badge */}
                          <div className="pt-1">
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border leading-none",
                              isAdminRole
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            )}>
                              <Shield size={8} />
                              {isAdminRole ? "Admin" : "Usuario"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg transition-all cursor-pointer"
                          title="Ver Detalles"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => handleEditClick(u)}
                          className="p-2 text-white/40 hover:text-blue-400 bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/20 rounded-lg transition-all cursor-pointer"
                          title="Editar Usuario"
                        >
                          <Edit size={14} />
                        </button>
                        
                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(u.usuario_id)}
                            className="p-2 text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-lg transition-all cursor-pointer"
                            title="Eliminar Usuario"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {usuarios.length === 0 && (
                <div className="text-center py-12 text-white/30 font-mono text-xs">
                  // No hay otros usuarios registrados en el sistema
                </div>
              )}

              {usuarios.length > 0 &&
                usuarios.filter((u) =>
                  u.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.usuario_email.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-12 text-white/30 font-mono text-xs">
                    // No se encontraron integrantes con ese criterio de búsqueda
                  </div>
                )}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL PARA VER DETALLES DEL USUARIO */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 bg-[#2a2a2a]/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 space-y-6 mx-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Eye size={14} /> Detalles del Integrante
              </h3>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1 text-white/40 hover:text-white bg-white/5 border border-white/10 rounded transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {/* ID */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">ID Único</span>
                <p className="text-xs font-mono text-white bg-[#131313]/60 border border-white/5 p-2 rounded-lg">{viewingUser.usuario_id}</p>
              </div>

              {/* Nombre */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">Nombre de Usuario</span>
                <p className="text-sm font-semibold text-white bg-[#131313]/60 border border-white/5 p-2 rounded-lg">{viewingUser.usuario_nombre}</p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">Correo Electrónico</span>
                <p className="text-sm font-mono text-white bg-[#131313]/60 border border-white/5 p-2 rounded-lg">{viewingUser.usuario_email || 'Sin correo registrado'}</p>
              </div>

              {/* Rol */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-wider">Rol de Sistema</span>
                <div className="bg-[#131313]/60 border border-white/5 p-2 rounded-lg">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold px-3 py-1 rounded-full border",
                    viewingUser.rol === "admin"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  )}>
                    <Shield size={10} />
                    {viewingUser.rol === "admin" ? "Administrador" : "Usuario Estándar"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-6 py-2.5 bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl transition-all duration-300 hover:bg-white/90 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para Scrollbar Personalizado */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3b82f6;
        }
      `}</style>
    </div>
  );
}
