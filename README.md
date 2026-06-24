# Consolink

Sistema de gestión de consorcios y edificios. Permite administrar expensas, tickets de reparaciones, avisos, documentos, calendario de eventos y la asignación de roles (propietarios, inquilinos, encargados y administradores).

## Estructura del repositorio

```
/
├── backend/                  # API REST (Express + Prisma + PostgreSQL)
│   ├── prisma/
│   │   ├── schema.prisma     # Modelo de datos
│   │   └── seed.ts           # Datos de ejemplo
│   ├── src/
│   │   ├── config/           # Env + Prisma client
│   │   ├── middlewares/      # auth, authorize, validate, error
│   │   ├── modules/          # 14 módulos (auth, users, tickets, etc.)
│   │   └── types/            # TypeScript declarations
│   └── package.json
│
└── frontend/
    └── consolink/            # Frontend SSR (Astro + React)
        ├── docs/             # Documentación del proyecto
        │   ├── ERD.md
        │   ├── ARQUITECTURA.md
        │   ├── API.md
        │   └── DECISIONES.md
        ├── src/
        │   ├── components/   # Islas de React (shadcn/ui)
        │   ├── lib/          # requireAuth, utils
        │   ├── pages/        # Rutas de Astro
        │   ├── styles/       # Tailwind + shadcn
        │   └── middleware.ts # Proxy de autenticación (cookie → backend)
        └── package.json
```

## Requisitos previos

- **Node.js** >= 22.12.0
- **pnpm** >= 9.x (npm y yarn no están soportados)
- **PostgreSQL** >= 15

## Instalación y arranque

### 1. Backend

```bash
cd backend
cp .env.example .env      # Editar DATABASE_URL, JWT_SECRET, etc.
pnpm install
pnpm prisma migrate dev   # Aplica migraciones
pnpm prisma db seed       # Carga datos de ejemplo (opcional)
pnpm dev                  # Inicia en http://localhost:3001
```

### 2. Frontend

```bash
cd frontend/consolink
# Crear .env (no existe .env.example, referencia abajo)
pnpm install
pnpm dev                  # Inicia en http://localhost:4321
```

> El backend debe estar corriendo antes que el frontend, ya que el middleware de Astro consulta `GET /api/auth/me` al iniciar cada request.

## Variables de entorno

> Este README está dentro de `frontend/consolink/`. Los paths relativos asumen esa ubicación.

### Backend (`backend/.env`)

| Variable | Descripción | Obligatoria | Default |
|----------|-------------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | Sí | — |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Sí | — |
| `PORT` | Puerto del servidor Express | No | `3001` |
| `FRONTEND_URL` | Origen del frontend (para CORS) | No | `http://localhost:4321` |
| `NODE_ENV` | Entorno (`development` / `production`) | No | — |

### Frontend (`frontend/consolink/.env`)

| Variable | Descripción | Obligatoria | Default |
|----------|-------------|-------------|---------|
| `PUBLIC_API_URL` | URL base de la API del backend | Sí | `http://localhost:3001/api` |

> **Atención:** El frontend **no** tiene archivo `.env.example`. Crear `.env` manualmente con `PUBLIC_API_URL=http://localhost:3001/api`.

## Documentación detallada

Ver [`/docs/`](./docs/) para documentación completa del proyecto:

- [`docs/ERD.md`](./docs/ERD.md) — Modelo entidad-relación
- [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) — Arquitectura y flujo de auth
- [`docs/API.md`](./docs/API.md) — Endpoints REST
- [`docs/DECISIONES.md`](./docs/DECISIONES.md) — Decisiones de diseño
