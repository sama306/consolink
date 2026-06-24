# Modelo Entidad-Relación — Consolink

> Basado en `prisma/schema.prisma` real. Actualizado al 2026-06-24.

## Convenciones generales

- Toda entidad posee: `id UUID (PK)`, `created_at DateTime`, `updated_at DateTime`, `deleted_at DateTime?` (soft delete). Las excepciones se indican explícitamente.
- Claves foráneas: `{entidad}_id` (UUID).
- Nombres en `snake_case` en la base de datos vía `@@map`.
- Todos los IDs usan `@default(uuid())` con `@db.Uuid`.

## Enumeraciones

### `RoleName`
`ADMIN` | `OWNER` | `TENANT` | `MANAGER`

### `TicketStatus`
`OPEN` | `IN_PROGRESS` | `PENDING` | `RESOLVED` | `CLOSED`

### `TicketPriority`
`LOW` | `MEDIUM` | `HIGH` | `URGENT`

### `ExpenseStatus`
`PENDING` | `PAID` | `OVERDUE`

### `AnnouncementPriority`
`LOW` | `NORMAL` | `HIGH` | `URGENT`

### `NotificationType`
`INFO` | `WARNING` | `ALERT` | `REMINDER`

---

## 1. User

Tabla central de autenticación. Toda persona que inicia sesión tiene un registro aquí, independientemente de sus roles.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| email | String | `@unique` |
| password_hash | String | |
| first_name | String | |
| last_name | String | |
| phone | String? | |
| avatar_url | String? | |
| email_verified_at | DateTime? | |
| is_active | Boolean | default `true` |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Índices:** `[email]`

**Relaciones:**
- → `UserRole[]`: 1:N (roles del usuario)
- → `Owner?`: 1:1 opcional (perfil propietario)
- → `Tenant?`: 1:1 opcional (perfil inquilino)
- → `Manager?`: 1:1 opcional (perfil encargado)
- → `Announcement[]` (AuthorAnnouncements): autor de avisos
- → `Ticket[]` (TicketAuthor): creador de tickets
- → `Ticket[]` (TicketAssignee): asignado a tickets
- → `TicketComment[]`: comentarios en tickets
- → `Document[]` (DocumentUploader): documentos subidos
- → `Expense[]` (ExpenseCreator): expensas creadas
- → `Notification[]`: notificaciones
- → `Activity[]`: actividad de auditoría
- → `CalendarEvent[]` (EventCreator): eventos creados

---

## 2. Role

Catálogo de roles del sistema. Se almacena en tabla para permitir descripciones y eventual expansión.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| name | RoleName | enum |
| description | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Relaciones:**
- → `UserRole[]`: 1:N

---

## 3. UserRole

Tabla puente N:M entre User y Role. Permite que un usuario tenga múltiples roles simultáneamente.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → User, `onDelete: Cascade` |
| role_id | UUID | FK → Role, `onDelete: Restrict` |
| consortium_id | UUID? | FK → Consortium, `onDelete: Cascade` (opcional, para roles acotados a un consorcio) |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Unique:** `@@unique([userId, roleId, consortiumId])`

**Cardinalidad:** User (1) ──< UserRole >── (N) Role

---

## 4. Owner

Perfil de propietario. Extiende a User con datos específicos de propiedad.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → User, `@unique`, `onDelete: Cascade` |
| dni | String? | `@unique` |
| tax_id | String? | |
| bank_info | Json? | |
| notes | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Índices:** `[dni]`

**Relaciones:**
- → `Apartment[]` (ApartmentOwner): departamentos que posee

---

## 5. Tenant

Perfil de inquilino. Extiende a User con datos del contrato de alquiler.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → User, `@unique`, `onDelete: Cascade` |
| lease_start | DateTime? | |
| lease_end | DateTime? | |
| deposit_amount | Decimal(12,2)? | |
| notes | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Relaciones:**
- → `Apartment?` (ApartmentTenant): departamento que ocupa actualmente

---

## 6. Manager

Perfil de encargado/administrador de edificios. Extiende a User.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → User, `@unique`, `onDelete: Cascade` |
| title | String? | Cargo (ej. "Administrador", "Encargado") |
| is_supervisor | Boolean | default `false` |
| notes | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Relaciones:**
- → `ManagerBuilding[]`: edificios que gestiona

---

## 7. Consortium

Entidad jurídica o agrupación de edificios.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| name | String | |
| tax_id | String? | |
| address | String? | |
| city | String? | |
| province | String? | |
| zip_code | String? | |
| phone | String? | |
| email | String? | |
| logo_url | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Relaciones:**
- → `Building[]`: 1:N
- → `UserRole[]`: roles vinculados al consorcio
- → `Announcement[]` (ConsortiumAnnouncements): avisos del consorcio
- → `Expense[]` (ConsortiumExpenses): gastos del consorcio
- → `Document[]` (ConsortiumDocuments): documentos del consorcio
- → `CalendarEvent[]` (ConsortiumEvents): eventos del consorcio

---

## 8. Building

Edificio dentro de un consorcio.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| consortium_id | UUID | FK → Consortium, `onDelete: Restrict` |
| name | String | |
| address | String? | |
| city | String? | |
| province | String? | |
| zip_code | String? | |
| total_floors | Int? | |
| total_units | Int? | |
| total_parking_spots | Int? | |
| total_storage_units | Int? | |
| total_area_m2 | Float? | |
| status | String? | default `"active"` |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Relaciones:**
- → `Apartment[]`: 1:N
- → `ManagerBuilding[]`: managers del edificio
- → `Announcement[]` (BuildingAnnouncements)
- → `Expense[]` (BuildingExpenses)
- → `Document[]` (BuildingDocuments)
- → `CalendarEvent[]` (BuildingEvents)

---

## 9. Apartment

Unidad funcional (departamento) dentro de un edificio.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| building_id | UUID | FK → Building, `onDelete: Restrict` |
| unit_number | String | |
| floor | Int? | |
| bedrooms | Int? | |
| bathrooms | Int? | |
| area_m2 | Float? | |
| parking_spots | Int? | |
| storage_units | Int? | |
| status | String? | default `"occupied"` |
| owner_id | UUID | FK → Owner, `onDelete: Restrict` |
| tenant_id | UUID? | FK → Tenant, `@unique`, `onDelete: SetNull` |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Unique:** `@@unique([buildingId, unitNumber])`

**Relaciones:**
- → `Ticket[]`: 1:N
- → `Expense[]` (ApartmentExpenses)
- → `Document[]` (ApartmentDocuments)

---

## 10. ManagerBuilding

Tabla puente N:M entre Manager y Building.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| manager_id | UUID | FK → Manager, `onDelete: Cascade` |
| building_id | UUID | FK → Building, `onDelete: Cascade` |
| is_primary | Boolean | default `false` |
| assigned_at | DateTime | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Unique:** `@@unique([managerId, buildingId])`

**Cardinalidad:** Manager (1) ──< ManagerBuilding >── (N) Building

---

## 11. Announcement

Aviso o comunicación publicada.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| author_id | UUID | FK → User, `onDelete: Restrict` |
| consortium_id | UUID? | FK → Consortium, `onDelete: Cascade` |
| building_id | UUID? | FK → Building, `onDelete: Cascade` |
| title | String | |
| content | String | |
| priority | AnnouncementPriority | default `NORMAL` |
| published_at | DateTime? | `null` = borrador |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

---

## 12. Ticket

Reporte de problema o solicitud de reparación.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| apartment_id | UUID | FK → Apartment, `onDelete: Restrict` |
| created_by_id | UUID | FK → User, `onDelete: Restrict` |
| assigned_to_id | UUID? | FK → User, `onDelete: SetNull` |
| title | String | |
| description | String | |
| status | TicketStatus | default `OPEN` |
| priority | TicketPriority | default `MEDIUM` |
| category | String? | |
| resolved_at | DateTime? | |
| closed_at | DateTime? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Índices:** `[status]`, `[apartmentId]`

**Relaciones:**
- → `TicketComment[]`: 1:N
- → `Document[]`: documentos adjuntos

---

## 13. TicketComment

Comentario o seguimiento dentro de un ticket.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| ticket_id | UUID | FK → Ticket, `onDelete: Cascade` |
| author_id | UUID | FK → User, `onDelete: Restrict` |
| content | String | |
| is_internal | Boolean | default `false` |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

---

## 14. Expense

Gasto registrado, imputable a consorcio, edificio o departamento.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| consortium_id | UUID? | FK → Consortium, `onDelete: Cascade` |
| building_id | UUID? | FK → Building, `onDelete: Cascade` |
| apartment_id | UUID? | FK → Apartment, `onDelete: Cascade` |
| created_by_id | UUID | FK → User, `onDelete: Restrict` |
| description | String | |
| amount | Decimal(12,2) | |
| category | String? | |
| status | ExpenseStatus | default `PENDING` |
| period | String? | ej. "2026-06" |
| due_date | DateTime? | |
| expense_date | DateTime | |
| receipt_url | String? | |
| is_recurring | Boolean | default `false` |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Índices:** `[apartmentId, period]`, `[status]`

---

## 15. Document

Archivo adjunto vinculable a distintas entidades.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| uploaded_by_id | UUID | FK → User, `onDelete: Restrict` |
| consortium_id | UUID? | FK → Consortium, `onDelete: Cascade` |
| building_id | UUID? | FK → Building, `onDelete: Cascade` |
| apartment_id | UUID? | FK → Apartment, `onDelete: Cascade` |
| ticket_id | UUID? | FK → Ticket, `onDelete: Cascade` |
| name | String | |
| file_url | String | |
| file_type | String? | |
| file_size | Int? | |
| category | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

---

## 16. Notification

Notificación dirigida a un usuario.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → User, `onDelete: Cascade` |
| title | String | |
| message | String | |
| type | NotificationType | default `INFO` |
| reference_type | String? | |
| reference_id | String? | UUID |
| is_read | Boolean | default `false` |
| read_at | DateTime? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Índices:** `[userId, isRead]`

---

## 17. Activity

Registro de auditoría inmutable (no tiene soft delete).

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → User, `onDelete: Restrict` |
| action | String | |
| entity_type | String | |
| entity_id | String | UUID |
| changes | Json? | |
| ip_address | String? | |
| user_agent | String? | |
| created_at | DateTime | |

**Índices:** `[userId]`, `[entityType, entityId]`

> No tiene `deletedAt` ni `updatedAt` — es un registro de auditoría inmutable.

---

## 18. CalendarEvent

Evento de calendario (reunión, vencimiento, mantenimiento, etc.).

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID | PK |
| consortium_id | UUID? | FK → Consortium, `onDelete: Cascade` |
| building_id | UUID? | FK → Building, `onDelete: Cascade` |
| created_by_id | UUID | FK → User, `onDelete: Restrict` |
| title | String | |
| description | String? | |
| start_date | DateTime | |
| end_date | DateTime? | |
| all_day | Boolean | default `false` |
| category | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |
| deleted_at | DateTime? | |

**Índices:** `[startDate]`

---

## Diagrama jerárquico

```
Consortium
  ├── Building
  │     ├── Apartment
  │     │     ├── Owner (1:1 activo, FK owner_id en Apartment)
  │     │     └── Tenant (0:1 activo, FK tenant_id en Apartment)
  │     ├── Announcement (ámbito edificio)
  │     ├── Expense (ámbito edificio)
  │     ├── CalendarEvent (ámbito edificio)
  │     ├── Document (ámbito edificio)
  │     └── Manager ──< ManagerBuilding >── Building (N:M)
  ├── Announcement (ámbito consorcio)
  ├── Expense (ámbito consorcio)
  ├── CalendarEvent (ámbito consorcio)
  └── Document (ámbito consorcio)

User ──< UserRole >── Role (N:M)
  ├── Owner  (1:1)
  ├── Tenant (1:1)
  └── Manager (1:1)

User ──< Notification
User ──< Activity (auditoría, inmutable)

Ticket ──< TicketComment
Apartment ──< Ticket
Ticket ── Document
```

## Resumen de cardinalidades

| Entidad A | Cardinalidad | Entidad B | Detalle |
|-----------|-------------|-----------|---------|
| User | 1 ──< N | UserRole | |
| Role | 1 ──< N | UserRole | |
| User | N >── M | Role | vía UserRole |
| User | 1 ── 0..1 | Owner | user_id unique |
| User | 1 ── 0..1 | Tenant | user_id unique |
| User | 1 ── 0..1 | Manager | user_id unique |
| Consortium | 1 ──< N | Building | |
| Building | 1 ──< N | Apartment | |
| Owner | 1 ──< N | Apartment | owner_id |
| Apartment | 0..1 ── 1 | Tenant | tenant_id unique, nullable |
| Manager | N >── M | Building | vía ManagerBuilding |
| Apartment | 1 ──< N | Ticket | |
| Ticket | 1 ──< N | TicketComment | |
| User | 1 ──< N | Announcement | autor |
| Consortium | 1 ──< N | Announcement | ámbito |
| Building | 1 ──< N | Announcement | ámbito |
| User | 1 ──< N | Notification | |
| User | 1 ──< N | Activity | auditoría |
| Consortium | 1 ──< N | CalendarEvent | |
| Building | 1 ──< N | CalendarEvent | |
| Doc/Expense | N ── 1 | Consortium/Building/Apartment/Ticket | FK opcionales |
