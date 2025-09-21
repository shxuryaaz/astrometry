import { useAuth } from "../context/AuthContext";

export async function apiFetch(path: string, options: RequestInit = {}, idToken?: string) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
  };

  const res = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(txt || "API error");
    (err as any).status = res.status;
    throw err;
  }

  return res.json();
}

// Helper hook to use API with auth
export const useApi = () => {
  const { idToken } = useAuth();
  
  return {
    fetch: (path: string, options: RequestInit = {}) => 
      apiFetch(path, options, idToken || undefined)
  };
};

