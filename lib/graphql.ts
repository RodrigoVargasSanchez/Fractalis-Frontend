// lib/graphql.ts

// Usamos la variable de entorno, y si no existe, el fallback a localhost
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:5000/graphql';

export async function fetchGraphQL(query: string, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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