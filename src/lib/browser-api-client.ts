const API_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3001/api";

export class BrowserApiError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = "BrowserApiError"
    this.code = code
    this.status = status
  }
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    window.location.href = "/login"
    throw new BrowserApiError("No autorizado", "UNAUTHORIZED", 401)
  }

  const payload = await res.json()

  if (!res.ok) {
    const message = payload?.error?.message ?? "Error desconocido"
    const code = payload?.error?.code ?? "API_ERROR"
    throw new BrowserApiError(message, code, res.status)
  }

  return payload
}

export function get<T = unknown>(path: string) {
  return request<T>("GET", path)
}

export function post<T = unknown>(path: string, body?: unknown) {
  return request<T>("POST", path, body)
}

export function put<T = unknown>(path: string, body?: unknown) {
  return request<T>("PUT", path, body)
}

export function del<T = unknown>(path: string) {
  return request<T>("DELETE", path)
}

