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

| Variable           | Descripción                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth; debe coincidir con el del frontend      |
| `JWT_SECRET`       | Secreto para firmar los JWT (usar uno largo y aleatorio)           |
| `PORT`             | Puerto del servidor (por defecto `3000`)                           |
| `DB_HOST`          | Host de PostgreSQL (por defecto `localhost`)                       |
| `DB_PORT`          | Puerto de PostgreSQL (por defecto `5432`)                          |
| `DB_USER`          | Usuario de PostgreSQL (por defecto `mi_usuario`)                   |
| `DB_PASSWORD`      | Contraseña de PostgreSQL (por defecto `mi_contraseña`)             |
| `DB_NAME`          | Base de datos (por defecto `mi_base_de_datos`)                     |

> En desarrollo `TypeOrmModule` corre con `synchronize: true`, por lo que el
> esquema se ajusta automáticamente a las entidades. No usar en producción.

## Base de datos

Desde la raíz del repositorio:

```bash
docker compose up -d
```

Levanta PostgreSQL en `localhost:5432` y pgAdmin en `http://localhost:8080`
(ver `docker-compose.yml` y `schema.sql`).

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

| Método | Ruta                 | Descripción                                        |
| ------ | -------------------- | -------------------------------------------------- |
| GET    | `/`                  | Health check: devuelve `Hello World!`              |
| POST   | `/auth/login/google` | Login con Google; recibe el ID token y devuelve JWT |

**POST `/auth/login/google`**

```jsonc
// request
{ "token": "<google_id_token>" }

// response
{
  "token": "<jwt>",
  "user": { "id": 1, "nombre": "Ada", "foto": "https://...", "email": "ada@mail.com" }
}
```

## Avanzado hasta ahora

Rama `feature-googlelogin` (aún sin commitear en su totalidad):

- **`AuthModule`** (`src/auth/auth.module.ts`): registra `TypeOrmModule.forFeature([Usuario])`
  y `JwtModule` global con `JWT_SECRET` y expiración de `7d`.
- **`AuthController`** (`src/auth/auth.controller.ts`): expone
  `POST /auth/login/google`.
- **`AuthService`** (`src/auth/auth.service.ts`): verifica el ID token de Google con
  `OAuth2Client.verifyIdToken` (audiencia `GOOGLE_CLIENT_ID`), hace *upsert* del
  usuario por `googleId`, firma un JWT (`sub`, `googleId`, `email`) y devuelve
  `token` + datos del usuario.
- **`Usuario`** (`src/auth/usuario.entity.ts`): entidad de la tabla `usuario`
  (`id`, `google_id` único, `email`, `nombre`, `foto`, `tipo` por defecto `cliente`).
- **`AppModule`** (`src/app.module.ts`): configura `TypeOrmModule.forRoot` para
  PostgreSQL e importa `AuthModule`.
- **`main.ts`**: habilita CORS con credenciales para el frontend y usa `PORT`.
- **Tests**: `auth.controller.spec.ts` y `auth.service.spec.ts`.

## Próximos pasos

- Estrategia/guard de JWT (`@nestjs/jwt` ya está instalado) para rutas protegidas.
- Módulos y entidades de `pedido` (asignación, estados, entrega).
- WebSockets (`@nestjs/websockets` + `platform-socket.io` ya están instalados) para
  seguimiento en tiempo real.
- Completar `.env.example` con las variables de base de datos y `PORT`.
- Desactivar `synchronize` y migrar el esquema a migraciones de TypeORM.

## Recursos

- [Documentación de NestJS](https://docs.nestjs.com)
- [TypeORM](https://typeorm.io)
- Contrato de sockets en `sockets_nest.md` y puertos en `env_y_puertos.md` (raíz del repo).
