# Backend

API de la aplicación de delivery construida con [NestJS](https://nestjs.com/) 11
y TypeScript. Persiste en **PostgreSQL** vía **TypeORM**.

Estado actual: **login con Google** (validación de ID token de Google) que emite un
JWT de sesión.

## Stack

- **NestJS 11** sobre Express
- **TypeORM 0.3** + **PostgreSQL** (`pg`)
- **google-auth-library** para verificar los ID tokens de Google
- **@nestjs/jwt** para firmar los JWT de sesión
- **Jest** + **Supertest** para tests (unitarios y e2e)
- **ESLint** + **Prettier** para lint y formato

## Requisitos

- Node.js (con soporte de `--env-file-if-exists`)
- npm
- PostgreSQL (se puede levantar con el `docker-compose.yml` de la raíz del repo)

## Configuración de entorno

Los scripts `start`/`start:dev`/`start:debug` cargan el archivo `.env`
automáticamente. Copiar el archivo de ejemplo y completarlo:

```bash
cp .env.example .env
```

| Variable                 | Descripción                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`       | Client ID de Google OAuth; debe coincidir con el del frontend |
| `JWT_SECRET`             | Secreto para firmar los JWT (usar uno largo y aleatorio)      |
| `JWT_ACCESS_TTL_SECONDS` | Vida del access token en segundos (por defecto `900` = 15 min) |
| `JWT_REFRESH_TTL_MS`     | Vida del refresh token en ms (por defecto 7 días)             |
| `DB_SYNCHRONIZE`         | `true` para que TypeORM ajuste el esquema (por defecto `false`) |
| `PORT`                   | Puerto del servidor (por defecto `3000`)                      |
| `DB_HOST`                | Host de PostgreSQL (por defecto `localhost`)                  |
| `DB_PORT`                | Puerto de PostgreSQL (por defecto `5432`)                     |
| `DB_USER`                | Usuario de PostgreSQL (por defecto `mi_usuario`)              |
| `DB_PASSWORD`            | Contraseña de PostgreSQL (por defecto `mi_contraseña`)        |
| `DB_NAME`                | Base de datos (por defecto `mi_base_de_datos`)                |

> Para probar la expiración de la sesión, bajar `JWT_ACCESS_TTL_SECONDS` (por
> ejemplo `10`) y recargar el frontend: el access token vence, pero mientras el
> refresh token siga vigente la sesión se renueva sola.

> **`synchronize` está desactivado por defecto** (`DB_SYNCHRONIZE=false`), así que
> TypeORM **no altera ni borra datos** al arrancar; el esquema lo define
> `schema.sql`. Para desarrollo puntual se puede activar con `DB_SYNCHRONIZE=true`
> (altera el esquema para que coincida con las entidades). No usar en producción.

## Base de datos

Desde la raíz del repositorio:

```bash
docker compose up -d
```

Levanta PostgreSQL en `localhost:5432` y pgAdmin en `http://localhost:8080`
(ver `docker-compose.yml` y `schema.sql`).

### Migraciones (TypeORM)

El esquema se versiona con **migraciones de TypeORM** a partir de
`src/data-source.ts` (usa las variables de `.env`, entidades `Usuario`,
`RefreshToken` y `Pedido`, y lee las migraciones de `src/migrations/`). Scripts
disponibles en `package.json`:

```bash
# crear una migración vacía
npm run migration:create -- src/migrations/NombreDeLaMigracion

# generar una migración a partir de las entidades
npm run migration:generate -- src/migrations/NombreDeLaMigracion

# aplicar migraciones pendientes
npm run migration:run

# revertir la última migración
npm run migration:revert
```

La migración inicial `AddRefreshToken` crea la tabla `refresh_token`. Las tablas
base (`usuario`, `pedido`, etc.) siguen definidas en `schema.sql`; `synchronize`
permanece desactivado en producción.

## Compilar y ejecutar

```bash
# desarrollo
npm run start

# watch mode
npm run start:dev

# modo debug (watch + inspector)
npm run start:debug

# producción (requiere build previo)
npm run build
npm run start:prod
```

El servidor escucha en `http://localhost:3000` por defecto y habilita CORS para
`http://localhost:4200` (origen del frontend Angular).

## Tests

```bash
# unitarios
npm test

# watch
npm run test:watch

# cobertura
npm run test:cov

# e2e
npm run test:e2e
```

## Lint y formato

```bash
npm run lint
npm run format
```

## Endpoints

| Método | Ruta                 | Auth | Descripción                                       |
| ------ | -------------------- | ---- | ------------------------------------------------- |
| GET    | `/`                  | —    | Health check: devuelve `Hello World!`             |
| POST   | `/auth/login/google` | —    | Login con Google; recibe el ID token y emite tokens |
| POST   | `/auth/refresh`      | —    | Rota el refresh token y emite un par nuevo        |
| POST   | `/auth/logout`       | —    | Revoca el refresh token                           |
| GET    | `/auth/me`           | JWT  | Devuelve el usuario de la sesión (Bearer access)  |

**POST `/auth/login/google`** y **POST `/auth/refresh`** devuelven:

```jsonc
// request login
{ "token": "<google_id_token>" }
// request refresh
{ "refreshToken": "<refresh_token>" }

// response
{
  "accessToken": "<jwt de corta vida>",
  "refreshToken": "<token de un solo uso>",
  "user": { "id": 1, "nombre": "Ada", "foto": "https://...", "email": "ada@mail.com" }
}
```

El **access token** (15 min por defecto) se envía como
`Authorization: Bearer <accessToken>`. Cuando expira, el frontend llama a
`/auth/refresh` con el **refresh token** (7 días, de un solo uso): cada refresh
revoca el token viejo y emite uno nuevo. `/auth/logout` revoca el refresh token,
por lo que la sesión deja de poder renovarse.

## Avanzado hasta ahora

Rama `feature-googlelogin` (aún sin commitear en su totalidad):

- **`AuthModule`** (`src/auth/auth.module.ts`): registra
  `TypeOrmModule.forFeature([Usuario, RefreshToken])` y `JwtModule` global con
  `JWT_SECRET`.
- **`AuthController`** (`src/auth/auth.controller.ts`): expone
  `POST /auth/login/google`, `POST /auth/refresh`, `POST /auth/logout` y
  `GET /auth/me` (protegido con `JwtAuthGuard`).
- **`AuthService`** (`src/auth/auth.service.ts`): verifica el ID token de Google
  con `OAuth2Client.verifyIdToken` (audiencia `GOOGLE_CLIENT_ID`), hace *upsert*
  del usuario por `googleId`, y emite un **access token** corto (JWT) más un
  **refresh token** opaco de un solo uso (guardado hasheado). `refresh()` valida y
  rota el token; `logout()` lo revoca.
- **`RefreshToken`** (`src/auth/refresh-token.entity.ts`): tabla `refresh_token`
  con `token_hash`, `usuario_id`, `expires_at` y `revoked_at`.
- **`JwtAuthGuard`** y **`CurrentUser`** (`src/auth/jwt-auth.guard.ts`,
  `src/auth/current-user.decorator.ts`): protegen rutas y exponen el payload del
  access token.
- **`Usuario`** (`src/auth/usuario.entity.ts`): entidad de la tabla `usuario`
  (`id`, `google_id` único, `email`, `nombre`, `foto`, `tipo` por defecto `cliente`).
- **`AppModule`** (`src/app.module.ts`): configura `TypeOrmModule.forRoot` para
  PostgreSQL (con `synchronize` desactivado) e importa `AuthModule` y `PedidoModule`.
- **`Pedido`** (`src/pedido/pedido.entity.ts` + `pedido.module.ts`): entidad
  mapeada a la tabla `pedido` de `schema.sql` (`nombre`, `ubicacion`, `driver_id`,
  `usuario_id`, `estado`, `destino`, `foto`), lista para inyectar su repositorio.
- **`main.ts`**: habilita CORS con credenciales para el frontend y usa `PORT`.
- **Tests**: specs de `AuthController` y `AuthService`.
- **Migraciones** (`src/data-source.ts` + `src/migrations/AddRefreshToken*`):
  migración inicial que crea la tabla `refresh_token`, con scripts
  `migration:create|generate|run|revert` en `package.json`.
- **`.env.example`**: completado con las variables opcionales y sus valores por
  defecto (TTLs, DB, `DB_SYNCHRONIZE`, `PORT`).

## Próximos pasos

- Endpoints de `pedido` (CRUD, asignación, estados) aplicando `JwtAuthGuard`.
- Lógica de roles cliente/driver.
- Limpieza periódica de refresh tokens expirados/revocados.
- WebSockets (`@nestjs/websockets` + `platform-socket.io` ya están instalados) para
  seguimiento en tiempo real.
- Completar las migraciones de TypeORM para el resto del esquema (hoy solo
  `refresh_token` está migrado; el resto vive en `schema.sql`).

## Recursos

- [Documentación de NestJS](https://docs.nestjs.com)
- [TypeORM](https://typeorm.io)
- Contrato de sockets en `sockets_nest.md` y puertos en `env_y_puertos.md` (raíz del repo).
