const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

export async function fetchHealth() {
  const res = await fetch(`${API_URL}/health`);

  if (!res.ok) {
    throw new Error('Failed to fetch health');
  }

  return res.json();
}