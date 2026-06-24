import type { APIRoute } from "astro"

const API_URL = process.env.PUBLIC_API_URL ?? "http://localhost:3001/api"

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const token = cookies.get("auth_token")?.value

  try {
    const backendRes = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: token ? `auth_token=${token}` : "",
      },
    })
    console.log("[logout] Set-Cookie from backend:", backendRes.headers.get("Set-Cookie"))
  } catch {
    // ignore backend errors, proceed to clear local cookie
  }

  cookies.delete("auth_token", { path: "/" })
  return redirect("/login")
}
