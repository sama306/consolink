import { defineMiddleware } from "astro:middleware";

const API_URL = process.env.PUBLIC_API_URL ?? "http://localhost:3001/api";

export type User = {
  id: string;
  email: string;
  roles: string[];
};

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get("auth_token")?.value;

  if (!token) {
    context.locals.user = undefined;
    return next();
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Cookie: `auth_token=${token}`,
      },
    });

    if (!res.ok) {
      context.locals.user = undefined;
      return next();
    }

    const body = await res.json();

    const apiUser = body.data;

    context.locals.user = {
      id: apiUser.id,
      email: apiUser.email,
      roles: (apiUser.userRoles ?? []).map((ur: any) => ur.role.name),
    };
  } catch {
    context.locals.user = undefined;
  }

  return next();
});
