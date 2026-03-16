// lib/graphql.ts
import { authService } from "@/services/authService";

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:5002/graphql';

/**
 * Helper para realizar peticiones a la API GraphQL.
 * Incluye automáticamente el token JWT de Fractalis si está disponible.
 */
export async function fetchGraphQL(query: string, variables = {}) {
  try {
    // Usamos el método centralizado del servicio de autenticación
    const token = authService.getToken(); 

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: 'no-store', 
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error('GraphQL Errors:', errors);
      throw new Error(errors[0].message || 'Error en la consulta GraphQL');
    }

    return data;
  } catch (error) {
    console.error('fetchGraphQL error:', error);
    throw error;
  }
}