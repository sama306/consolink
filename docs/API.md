# API REST — Consolink

> Documentación generada inspeccionando los archivos `*.routes.ts` y `*.schema.ts` reales del backend.

Base URL: `http://localhost:3001/api`

---

## Dominio: Auth (`/api/auth`)

Rutas públicas (sin middleware `authenticate`), excepto `/me` que requiere autenticación.

| Método | Ruta | Roles | Body (Zod) | Respuesta exitosa |
|--------|------|-------|------------|-------------------|
| POST | `/api/auth/register` | Público | `{ email: string, password: string (min 6), firstName: string, lastName: string, phone?: string, roleName?: "ADMIN"\|"OWNER"\|"TENANT"\|"MANAGER" (default OWNER) }` | `201` `{ status: "ok", data: { user } }` + Set-Cookie `auth_token` |
| POST | `/api/auth/login` | Público (rate limit: 5 req/15 min) | `{ email: string, password: string }` | `200` `{ status: "ok", data: { user } }` + Set-Cookie `auth_token` |
| POST | `/api/auth/logout` | Público | — | `200` `{ status: "ok", message: "Logged out successfully" }` + Clear-Cookie `auth_token` |
| GET | `/api/auth/me` | Autenticado | — | `200` `{ status: "ok", data: { user, userRoles, owner?, tenant?, manager? } }` |

> Las rutas de auth NO usan el middleware `authenticate` global, se protegen individualmente.
> Login tiene rate limiting: 5 intentos cada 15 minutos.

---

## Dominio: Users (`/api/users`)

Todas las rutas requieren autenticación **y** rol ADMIN.

| Método | Ruta | Roles | Body | Respuesta exitosa |
|--------|------|-------|------|-------------------|
| GET | `/api/users` | ADMIN | — | Lista de usuarios (con userRoles, sin password_hash) |
| GET | `/api/users/:id` | ADMIN | — | Usuario por ID |
| POST | `/api/users` | ADMIN | `{ email, password (min 6), firstName, lastName, phone?, roleName }` | `201` Usuario creado |
| PATCH | `/api/users/:id` | ADMIN | `{ firstName?, lastName?, phone?, avatarUrl?, isActive? }` | Usuario actualizado |
| PUT | `/api/users/:id/roles` | ADMIN | `{ roles: [{ roleName: "ADMIN"\|"OWNER"\|"TENANT"\|"MANAGER", action: "add"\|"remove" }] }` | Usuario con roles actualizados |
| POST | `/api/users/:id/reset-password` | ADMIN | `{ password: string (min 6) }` | `{ message: "Password updated successfully" }` |
| DELETE | `/api/users/:id` | ADMIN | — | `204` Soft delete |

---

## Dominio: Roles (`/api/roles`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| — | `/api/roles` | — | — | Router vacío. No hay endpoints implementados. |

---

## Dominio: Consortiums (`/api/consortiums`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/consortiums` | ADMIN | — | Lista (paginada por `listConsortiumsSchema`) |
| GET | `/api/consortiums/:id` | ADMIN | — | Consorcio por ID |
| POST | `/api/consortiums` | ADMIN | `{ name, taxId?, address?, city?, province?, zipCode?, phone?, email?, logoUrl? }` | Consorcio creado |
| PUT | `/api/consortiums/:id` | ADMIN | `{ name?, taxId?, address?, ... }` | Consorcio actualizado |
| DELETE | `/api/consortiums/:id` | ADMIN | — | Soft delete |

---

## Dominio: Buildings (`/api/buildings`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/buildings` | ADMIN, MANAGER | Query: `page?`, `limit?`, `consortiumId?` | Lista paginada |
| GET | `/api/buildings/:id` | ADMIN, MANAGER | — | Edificio por ID |
| POST | `/api/buildings` | ADMIN, MANAGER | `{ consortiumId, name, address?, city?, ... }` | Creado |
| PUT | `/api/buildings/:id` | ADMIN, MANAGER | `{ name?, address?, ... }` | Actualizado |
| DELETE | `/api/buildings/:id` | ADMIN | — | Soft delete |

---

## Dominio: Apartments (`/api/apartments`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/apartments` | ADMIN, MANAGER, OWNER, TENANT | Query: `page?`, `limit?`, `buildingId?` | Lista paginada |
| GET | `/api/apartments/:id` | ADMIN, MANAGER, OWNER, TENANT | — | Departamento por ID |
| POST | `/api/apartments` | ADMIN, MANAGER | `{ buildingId, unitNumber, floor?, ..., ownerId, tenantId? }` | Creado |
| PUT | `/api/apartments/:id` | ADMIN, MANAGER | `{ unitNumber?, floor?, ... }` | Actualizado |
| DELETE | `/api/apartments/:id` | ADMIN | — | Soft delete |

---

## Dominio: Owners (`/api/owners`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/owners` | ADMIN, MANAGER | Query: `page?`, `limit?`, `search?` (busca en nombre, email, DNI) | Lista paginada |
| GET | `/api/owners/:id` | ADMIN, MANAGER, OWNER | — | Owner por ID |
| GET | `/api/owners/:id/apartments` | ADMIN, MANAGER, OWNER | — | Departamentos del owner |
| POST | `/api/owners` | ADMIN | `{ userId, dni, taxId?, bankInfo?, notes? }` | Creado |
| PUT | `/api/owners/:id` | ADMIN | `{ dni?, taxId?, bankInfo?, notes? }` | Actualizado |
| DELETE | `/api/owners/:id` | ADMIN | — | Soft delete |

---

## Dominio: Tenants (`/api/tenants`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/tenants` | ADMIN, MANAGER | Query: `page?`, `limit?`, `search?` (busca en nombre, email) | Lista paginada |
| GET | `/api/tenants/:id` | ADMIN, MANAGER, OWNER, TENANT | — | Tenant por ID |
| GET | `/api/tenants/:id/apartment` | ADMIN, MANAGER, OWNER, TENANT | — | Departamento asignado al tenant (incluye building y consortium) |
| GET | `/api/tenants/:id/contract-status` | ADMIN, MANAGER, OWNER, TENANT | — | Estado del contrato |
| POST | `/api/tenants` | ADMIN | `{ userId, leaseStart?, leaseEnd?, depositAmount?, notes? }` | Creado |
| PUT | `/api/tenants/:id` | ADMIN | `{ leaseStart?, leaseEnd?, ... }` | Actualizado |
| DELETE | `/api/tenants/:id` | ADMIN | — | Soft delete |

---

## Dominio: Managers (`/api/managers`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/managers` | ADMIN | Query: `page?`, `limit?`, `search?` (busca en nombre, email) | Lista paginada |
| GET | `/api/managers/:id` | ADMIN, MANAGER | — | Manager por ID |
| POST | `/api/managers` | ADMIN | `{ userId, title?, isSupervisor?, notes? }` | Creado |
| PUT | `/api/managers/:id` | ADMIN | `{ title?, isSupervisor?, notes? }` | Actualizado |
| DELETE | `/api/managers/:id` | ADMIN | — | Soft delete |

---

## Dominio: Tickets (`/api/tickets`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/tickets` | ADMIN, MANAGER, OWNER, TENANT | Query: `page?`, `limit?`, `status?`, `priority?` | Lista paginada |
| GET | `/api/tickets/:id` | ADMIN, MANAGER, OWNER, TENANT | — | Ticket por ID |
| POST | `/api/tickets` | OWNER, TENANT | `{ apartmentId, title (max 200), description, priority?, suggestedManagerId? }` | Creado |
| PUT | `/api/tickets/:id/assign` | ADMIN | `{ assignedToId }` | Asignado |
| PUT | `/api/tickets/:id/status` | ADMIN, MANAGER | `{ status: "OPEN"\|"IN_PROGRESS"\|"PENDING"\|"RESOLVED"\|"CLOSED" }` | Estado actualizado |
| POST | `/api/tickets/:id/comments` | ADMIN, MANAGER, OWNER, TENANT | `{ content }` (sin schema explícito en routes, se valida en controller) | Comentario creado |

---

## Dominio: Documents (`/api/documents`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/documents` | ADMIN, MANAGER, OWNER, TENANT | Query: `page?`, `limit?`, `apartmentId?`, `consortiumId?` | Lista paginada |
| POST | `/api/documents` | ADMIN, MANAGER, OWNER, TENANT | Multipart: `file` + fields: `name`, `category?`, `consortiumId?`, `buildingId?`, `apartmentId?`, `ticketId?` | Subido (multer, max 10 MB) |

---

## Dominio: Expenses (`/api/expenses`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/expenses` | ADMIN, MANAGER, OWNER, TENANT | Query: `page?`, `limit?`, `apartmentId?`, `period?`, `status?` | Lista paginada |
| PUT | `/api/expenses/:id/mark-paid` | ADMIN | — | Marcada como pagada (`status: "PAID"`) |
| PUT | `/api/expenses/:id/mark-pending` | ADMIN | — | Revierte a pendiente solo si estaba `PAID` (corrección manual) |
| POST | `/api/expenses/generate` | ADMIN | `{ consortiumId, period, description, amount, dueDate? }` | Genera expensas masivas para todos los deptos del consorcio |

---

## Dominio: Announcements (`/api/announcements`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/announcements` | ADMIN, MANAGER, OWNER, TENANT | Query: `page?`, `limit?`, `consortiumId?`, `buildingId?` | Lista paginada |
| GET | `/api/announcements/:id` | ADMIN, MANAGER, OWNER, TENANT | — | Aviso por ID |
| POST | `/api/announcements` | ADMIN | `{ title (max 200), content, priority?, consortiumId?, buildingId?, publishedAt? }` | Creado |
| PUT | `/api/announcements/:id` | ADMIN | `{ title?, content?, priority?, ... }` | Actualizado |
| DELETE | `/api/announcements/:id` | ADMIN | — | Soft delete |

---

## Dominio: Notifications (`/api/notifications`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/notifications` | Autenticado | Query: `page?`, `limit?`, `unreadOnly?` | Lista paginada (del usuario autenticado) |
| PUT | `/api/notifications/:id/read` | Autenticado | — | Marcada como leída |

> No tiene middleware `authorize`; cada usuario ve solo sus propias notificaciones.

---

## Dominio: Calendar (`/api/calendar`)

| Método | Ruta | Roles | Body | Respuesta |
|--------|------|-------|------|-----------|
| GET | `/api/calendar` | ADMIN, MANAGER, OWNER, TENANT | Query: `page?`, `limit?`, `consortiumId?`, `buildingId?`, `startDate?`, `endDate?` | Lista paginada |
| GET | `/api/calendar/:id` | ADMIN, MANAGER, OWNER, TENANT | — | Evento por ID |
| POST | `/api/calendar` | ADMIN, MANAGER | `{ title (max 200), startDate, consortiumId?, buildingId?, description?, endDate?, allDay?, category? }` | Creado |
| PUT | `/api/calendar/:id` | ADMIN, MANAGER | `{ title?, startDate?, ... }` | Actualizado |
| DELETE | `/api/calendar/:id` | ADMIN | — | Soft delete |

---

## Health Check

| Método | Ruta | Roles | Respuesta |
|--------|------|-------|-----------|
| GET | `/health` | Público | `{ status: "ok" }` |

## Formato de error estándar

```json
{
  "error": {
    "message": "Descripción del error",
    "code": "API_ERROR | VALIDATION_ERROR | DUPLICATE_ENTRY | NOT_FOUND | DATABASE_ERROR | INTERNAL_ERROR"
  },
  "issues": [ /* solo si es ZodError */ ],
  "details": [ /* solo si es Prisma P2002 */ ]
}
```
