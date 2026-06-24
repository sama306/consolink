import type { AstroGlobal } from "astro";
import type { User } from "@/middleware";

/**
 * Devuelve el usuario autenticado (poblado por el middleware en Astro.locals.user).
 * Si no hay sesión, retorna un Response de redirección a /login.
 *
 * Modo de uso (en frontmatter de páginas protegidas):
 *   const _user = requireAuth(Astro);
 *   if (_user instanceof Response) return _user;
 *   const user = _user;
 */
export function requireAuth(Astro: AstroGlobal): User | Response {
  if (!Astro.locals.user) {
    return Astro.redirect("/login");
  }
  return Astro.locals.user;
}

/**
 * Como requireAuth, pero además verifica que el usuario tenga al menos uno
 * de los roles indicados. Si no tiene ninguno, redirige a /unauthorized.
 *
 * Modo de uso:
 *   const _user = requireRole(Astro, ["ADMIN", "OWNER"]);
 *   if (_user instanceof Response) return _user;
 *   const user = _user;
 */
export function requireRole(Astro: AstroGlobal, roles: string[]): User | Response {
  const user = Astro.locals.user;

  if (!user) {
    return Astro.redirect("/login");
  }

  if (!roles.some((r) => user.roles?.includes(r))) {
    return Astro.redirect("/unauthorized");
  }

  return user;
}
