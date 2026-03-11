import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// La función DEBE llamarse 'middleware' y ser exportada
export function middleware(request: NextRequest) {
  // Nota: En el middleware usamos cookies porque localStorage no existe en el servidor
  const token = request.cookies.get('fractalis_token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Si no hay token y no está en login, redirigir a login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si hay token e intenta ir a login, redirigir al dashboard (espacios)
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/espacios', request.url));
  }

  return NextResponse.next();
}

// Configuración de las rutas que el middleware debe interceptar
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, logofractalis.png (archivos en public)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logofractalis.png).*)',
  ],
};