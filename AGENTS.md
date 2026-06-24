# AGENTS.md — Consolink

Instrucciones para agentes de código (IA) que trabajen en este proyecto.

---

## Gestor de paquetes

- Usar **pnpm** exclusivamente. No usar `npm` ni `yarn`.
- El proyecto tiene dos `package.json` independientes. No mezclar dependencias entre `backend/` y `frontend/`.

---

## Estructura del repo

- `backend/` — API REST (Express + Prisma). Proyecto independiente con su propio `package.json`, TypeScript y dependencias.
- `frontend/consolink/` — Frontend SSR (Astro + React). Proyecto independiente con su propio `package.json`, TypeScript y dependencias.
- `docs/` — Documentación del proyecto en Markdown (dentro de `frontend/consolink/`).
- No hay un monorepo unificado; cada proyecto se ejecuta por separado.

---

## Convenciones de backend (`backend/`)

### Arquitectura por capas (por módulo)

Cada módulo en `src/modules/<nombre>/` tiene:

| Archivo | Rol |
|---------|-----|
| `*.routes.ts` | Definición de rutas HTTP + middlewares (authenticate, authorize, validate) |
| `*.controller.ts` | Manejo de request/response, llama al servicio |
| `*.service.ts` | Lógica de negocio, llama a Prisma |
| `*.schema.ts` | Schemas Zod para validación de entrada |
| `index.ts` | Re-exporta todo |

### Reglas

- **Validación:** Usar Zod para validar `req.body` mediante el middleware `validate()`. Definir schemas en `*.schema.ts` y usar `z.infer` para tipos.
- **Base de datos:** `snake_case` en PostgreSQL vía `@map` (columnas) y `@@map` (tablas). `camelCase` en TypeScript.
- **Soft delete:** Toda entidad tiene `deletedAt: DateTime?`. Nunca hacer `DELETE FROM` físicos, salvo que se indique explícitamente. Filtrar `deletedAt: null` en todas las queries.
- **UUID como id:** Todos los IDs son `@id @default(uuid()) @db.Uuid`. Nunca usar `serial`/autoincrementales.
- **Autenticación:** JWT en cookie httpOnly (`auth_token`) con fallback a `Authorization: Bearer`. El middleware `authenticate` verifica el token y adjunta `req.user`.
- **Autorización:** El middleware `authorize(...allowedRoles)` restringe endpoints por rol.
- **Manejo de errores:** Usar `ApiError` para errores conocidos. El `errorMiddleware` captura `ApiError`, `ZodError` y errores de Prisma.
- **Prisma:** Usar `@prisma/adapter-pg` con driver `pg`. No usar el cliente HTTP.
- **Migraciones:** Para modificar `schema.prisma`, crear una migración nueva con `pnpm prisma migrate dev --name <desc>`. Nunca editar una migración ya aplicada.

---

## Convenciones de frontend (`frontend/consolink/`)

- **Astro SSR:** `output: 'server'`, adaptador `@astrojs/node` modo standalone.
- **Islas de React:** Solo donde haya interactividad. Usar React 19 con `@astrojs/react`.
- **Data fetching:** Usar **TanStack React Query** para consultas a la API. No usar `fetch()` directo en componentes del cliente.
- **UI:** shadcn/ui (estilo `radix-nova`) + Tailwind CSS v4 + Radix UI primitives + Lucide icons.
- **Estado global:** Zustand solo para estado de UI (temas, sidebar, etc.). No mezclar con estado del servidor.
- **Formularios:** React Hook Form + Zod + `@hookform/resolvers`.
- **Autenticación:** Cookie httpOnly manejada por el backend. El frontend **nunca** debe leer ni enviar manualmente el token JWT desde JavaScript del cliente. No usar `localStorage` ni `Authorization` headers manuales.
  - El middleware `src/middleware.ts` lee la cookie `auth_token` y la envía al backend (`GET /api/auth/me`).
  - `src/lib/requireAuth.ts` provee helpers `requireAuth()` y `requireRole()` para páginas Astro.
- **Tipos:** El `src/env.d.ts` extiende `App.Locals` con `user`. Usar `Astro.locals.user` para acceder al usuario autenticado.
- **Rutas:** Las páginas protegidas deben llamar `requireAuth(Astro)` o `requireRole(Astro, [...roles])` al inicio del frontmatter.

---

## Reglas de autorización

- El sistema usa **roles many-to-many** vía la tabla `UserRole`. Un usuario puede tener varios roles a la vez (ej. ADMIN + OWNER).
- **Nunca asumir un único rol fijo por usuario.** Siempre verificar pertenencia a un conjunto.
- `req.user.roles` es un array de `{ roleId, roleName, consortiumId? }`.
- El middleware `authorize(...)` acepta uno o más nombres de rol y permite acceso si el usuario tiene al menos uno.

---

## Documentación

- **Al agregar un endpoint nuevo**, actualizar `docs/API.md` (en `frontend/consolink/docs/API.md`) reflejando método, ruta, body, roles y respuesta.
- **Al modificar el schema de Prisma**, asegurarse de que `docs/ERD.md` refleje los cambios.
- **Decisiones técnicas importantes** deben registrarse en `docs/DECISIONES.md`.

---

## Cómo correr en desarrollo

### Backend

```bash
cd backend
cp .env.example .env          # Configurar DATABASE_URL y JWT_SECRET
pnpm install
pnpm prisma migrate dev        # Aplicar migraciones
pnpm prisma db seed            # Datos de ejemplo (opcional)
pnpm dev                       # http://localhost:3001
```

Comando de desarrollo: `pnpm dev` (usa `ts-node-dev --respawn --transpile-only`).

### Frontend

```bash
cd frontend/consolink
# Crear .env con: PUBLIC_API_URL=http://localhost:3001/api
pnpm install
pnpm dev                       # http://localhost:4321
```

Comando de desarrollo: `pnpm dev` (usa `astro dev`).

> El backend debe estar corriendo antes que el frontend.

### Archivos .env

| Proyecto | Archivo .env | ¿Tiene .env.example? |
|----------|-------------|----------------------|
| `backend/` | `backend/.env` | Sí (`backend/.env.example`) |
| `frontend/consolink/` | `frontend/consolink/.env` | **No** (crear manualmente) |
