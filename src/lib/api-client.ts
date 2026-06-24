const API_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3001/api";

type ApiResponse<T> = { status: string; data: T };

export async function serverFetch<T = unknown>(
  path: string,
  token?: string,
): Promise<T | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Cookie = `auth_token=${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, { headers });
    if (!res.ok) return null;

    const body: ApiResponse<T> = await res.json();
    return body.data ?? null;
  } catch {
    return null;
  }
}
