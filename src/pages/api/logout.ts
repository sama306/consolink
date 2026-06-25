import type { APIRoute } from "astro"

const API_URL = process.env.PUBLIC_API_URL ?? "http://localhost:3001/api"

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const token = cookies.get("auth_token")?.value

  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: token ? `auth_token=${token}` : "",
      },
    })
  } catch {
    // ignore backend errors, proceed to clear local cookie
  }

  cookies.delete("auth_token", { path: "/" })
  return redirect("/login")
}
