# Decisiones de diseño — Consolink

## Roles many-to-many vía UserRole

**Decisión:** Los roles se asignan a los usuarios mediante una tabla puente `UserRole` en lugar de un campo `role` único en `User`.

**Justificación:** Un usuario puede tener múltiples roles simultáneamente (ej. ser OWNER de un departamento y MANAGER de un edificio). Con una relación N:M se evita duplicar el registro de usuario y se permite granularidad fina (cada rol puede tener metadatos como `consortiumId`). Adicionalmente, la tabla puente permite auditoría de cuándo se asignó cada rol.

---

## Soft delete con `deleted_at`

**Decisión:** Ninguna entidad se elimina físicamente de la base de datos. Todas tienen un campo `deletedAt: DateTime?`. Las consultas deben filtrar por `deletedAt: null`.

**Justificación:** Conserjes, propietarios y administraciones suelen necesitar recuperar datos históricos (ej. un propietario que vendió su unidad pero necesita un comprobante de expensas de 2 años atrás). El soft delete permite "eliminar" sin perder información, mantiene la integridad referencial y facilita auditorías. La única excepción es `Activity` (auditoría), que es inmutable y no tiene soft delete.

---

## UUID como tipo de id

**Decisión:** Todos los IDs primarios son UUID v4 en lugar de `serial`/autoincrementales.

**Justificación:** UUIDs permiten generar IDs en el frontend sin consultar la base de datos, facilitan la replicación futura y evitan la enumeración de recursos (un atacante no puede adivinar IDs secuenciales). En PostgreSQL el desempeño es aceptable con índices UUID y la función `gen_random_uuid()` es nativa.

---

## JWT en cookie httpOnly vs localStorage

**Decisión:** El token JWT se almacena en una cookie `httpOnly` (`auth_token`) en lugar de `localStorage` o `sessionStorage`.

**Justificación:** Las cookies `httpOnly` no son accesibles desde JavaScript del lado del cliente, lo que elimina el vector de ataque XSS para robo de token. El flag `SameSite=lax` protege contra CSRF en la mayoría de los casos. En producción se agrega `secure: true` para que solo viaje por HTTPS. El backend también acepta `Authorization: Bearer` como fallback para herramientas de terceros.

| Aspecto | Cookie httpOnly | localStorage |
|---------|----------------|--------------|
| Accesible desde JS | No | Sí |
| Protegido contra XSS | Sí | No |
| CSRF | Parcial (SameSite) | No aplica |
| Envío automático | Sí (en cada request al mismo dominio) | No (hay que leerlo y enviarlo manualmente) |

---

## SSR (Server-Side Rendering) vs SSG en Astro

**Decisión:** El frontend usa Astro con `output: 'server'` (SSR) en lugar del modo estático (SSG).

**Justificación:** La aplicación requiere contenido dinámico y personalizado por usuario autenticado (tablero de expensas, tickets, notificaciones). Con SSR, el servidor de Astro puede leer la cookie `auth_token`, llamar al backend para obtener los datos del usuario y renderizar la página en el servidor antes de enviarla al navegador. SSG generaría páginas estáticas que no pueden variar por usuario.

> **Nota:** El frontend en Astro usa un proxy de autenticación en el middleware: lee la cookie y la reenvía al backend (`GET /api/auth/me`). No se implementó un data fetching directo del lado del servidor Astro más allá del middleware.

---

## Express con capas (routes/controller/service/schema)

**Decisión:** Cada módulo del backend se organiza en 4 archivos separados.

**Justificación:** Separa claramente la definición de rutas (HTTP), la lógica de control (request/response), la lógica de negocio (servicio) y la validación (schema Zod). Esto facilita el testing unitario de servicios, el cambio de framework HTTP sin tocar lógica de negocio, y la reutilización de servicios entre controladores.

---

## Zod para validación en backend

**Decisión:** Se usa Zod 4.x para validar `req.body` a través de un middleware `validate` que reemplaza el body con los datos parseados.

**Justificación:** Zod es type-safe, se integra nativamente con TypeScript (`z.infer`), y permite definir schemas que se usan tanto para validación en runtime como para tipos estáticos. El middleware `validate` arroja `ZodError` que es capturado por el manejador de errores unificado.

---

## snake_case en base de datos via @@map

**Decisión:** En Prisma, los modelos se nombran en PascalCase (convención TypeScript) pero se mapean a `snake_case` en PostgreSQL mediante `@map` y `@@map`.

**Justificación:** PostgreSQL y los DBAs tradicionalmente usan `snake_case` para nombres de tablas y columnas. TypeScript/Prisma usan `camelCase`. El `@@map` y `@map` permiten tener ambos mundos sin conflictos.

---

## Prisma con adaptador PostgreSQL nativo

**Decisión:** Se usa `@prisma/adapter-pg` con el driver `pg` en lugar del cliente HTTP de Prisma.

**Justificación:** El adaptador nativo evita el overhead de HTTP y permite usar connection pooling con `pg` directamente. Es la recomendación de Prisma para Node.js con PostgreSQL en producción.
