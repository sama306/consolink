import type { AstroGlobal } from "astro";

export function requireAuth(Astro: AstroGlobal) {
  if (!Astro.locals.user) {
    return Astro.redirect("/login");
  }
  return Astro.locals.user;
}

export function requireRole(Astro: AstroGlobal, roles: string[]) {
  const user = Astro.locals.user;

  if (!user) {
    return Astro.redirect("/login");
  }

  if (!roles.some((r) => user.roles.includes(r))) {
    return Astro.redirect("/unauthorized");
  }

  return user;
}
