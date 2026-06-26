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

---

## Checklist de verificación antes de cerrar una sesión

Basado en bugs reales ya corregidos en este proyecto. Revisar cada punto antes de dar una tarea por terminada.

1. **Inputs de filtro:** nunca definir un componente de input dentro del cuerpo de otro componente (se recrea en cada render y pierde foco). Si un filtro dispara fetch en cada tecla, usar debounce de 300ms. Verificar escribiendo una palabra completa de corrido sin reclickear.

2. **Selectores que dependen de otra entidad** (ej: Building selecciona Consortium): confirmar que el hook de la entidad padre se llama correctamente y el Select mapea `value`/`label` con datos reales. Verificar visualmente en el navegador, no solo leyendo el código.

3. **Querys con filtros opcionales:** nunca enviar un parámetro con valor `"undefined"` (string) o vacío al backend cuando el filtro es "todos" — omitir el parámetro completamente de la query string en ese caso.

4. **Tipos entre frontend y backend:** antes de dar por terminado un formulario, comparar el schema de Zod del backend (campo por campo, tipo por tipo) contra lo que el formulario realmente envía. Los inputs HTML siempre devuelven `string` — usar `z.coerce.number()` o parsear explícitamente antes de enviar campos numéricos. Las fechas deben ir en el formato exacto que Zod espera. Probar creación real contra el backend (status 201) antes de considerar el formulario funcional, no asumir por la lectura del código.

5. **Select dentro de Dialog:** probar específicamente hacer click en una opción del Select y confirmar que el modal no se cierra ni cancela la operación (conflicto conocido entre el portal de Radix Select y el overlay de Dialog).

6. **QueryProvider:** en Astro con SSR + islas, cada `client:*` es una raíz React independiente sin contexto compartido entre islas. El patrón de este proyecto es "una isla `*PageRoot.tsx` por página" con QueryProvider en su raíz, nunca un QueryProvider duplicado dentro de un componente hijo de esa misma isla.

7. **Edición de password:** el campo password en un formulario de EDICIÓN (no creación) debe ser opcional y NO enviarse en el body si el campo quedó vacío. El backend nunca debe re-hashear ni sobrescribir `password_hash` si el campo no viene presente en el body del request. Después de cualquier cambio en este flujo, probar: editar sin tocar password → el usuario debe poder seguir logueándose con su contraseña original.

8. **Asignación de rol al crear un usuario:** el rol del nuevo usuario debe tomarse SIEMPRE explícitamente del body de la request (`roleName` enviado por el formulario correspondiente: OWNER para owners, TENANT para tenants, MANAGER para managers), nunca inferido del usuario que hace la request (`req.user`). Verificar en Network el body real enviado, y probar login con el usuario recién creado confirmando que tiene el rol correcto, no ADMIN por defecto.

9. **Navegación por rol (sidebar):** la lógica de qué secciones mostrar debe combinar TODOS los roles que el usuario tenga (usando `includes()` por cada rol relevante), nunca un `if/else if` exclusivo que solo considere un rol a la vez. Probar con un usuario de un solo rol y con otro multi-rol (ej: ADMIN + OWNER).

10. **Páginas huérfanas:** toda página nueva protegida con `requireRole()` debe tener un link visible en la navegación correspondiente a ese rol. Antes de cerrar una sesión, verificar que no quede ninguna página accesible solo escribiendo la URL a mano.

11. **Puerto ocupado:** antes de iniciar el servidor backend para pruebas manuales desde PowerShell, verificar que no haya procesos node/ts-node colgados de una sesión anterior ocupando el puerto 3001 (`Get-NetTCPConnection -LocalPort 3001`) antes de levantar uno nuevo.
