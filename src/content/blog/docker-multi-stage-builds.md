---
title: "Docker multi-stage builds: el cambio que redujo el tamaño de nuestra imagen un 70%"
description: "Un Dockerfile naïve para una app Ruby o Node puede generar imágenes de 2GB. Con multi-stage builds, la misma app puede quedar en 200MB. Te muestro cómo."
pubDate: 2025-05-06
tags: ["docker", "devops"]
draft: false
---

## TL;DR

- Una imagen naïve incluye **herramientas de build** (gcc, bundler, npm) que no necesitas en producción
- **Multi-stage builds** te permiten tener una stage de build y una stage de runtime — copias solo lo necesario
- El resultado típico: **imágenes 60-80% más pequeñas** — menos tiempo de pull, menos superficie de ataque
- **`.dockerignore`** no es opcional — sin él estás copiando `node_modules` y `.git` a tu imagen
- La imagen base importa: `alpine` es la más pequeña, pero puede dar problemas; `slim` es el balance correcto

---

## El Dockerfile que todos empezamos teniendo — y que da vergüenza ajena

Arranca un proyecto Ruby on Rails, googleas "Dockerfile Rails", y terminas con algo así:

```dockerfile
FROM ruby:3.3

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    nodejs \
    yarn

# Copiar todo y hacer bundle
COPY . .
RUN bundle install
RUN yarn install
RUN bundle exec rails assets:precompile

EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
```

Funciona. Pero `docker images` te va a mostrar algo así:

```sh
REPOSITORY   TAG      SIZE
my-rails-app latest   2.14GB
```

2.1GB. Para una app que en runtime necesita Ruby, los gems compilados, y tus archivos estáticos. Oops. El problema: estás cargando `build-essential` (compiladores de C), `nodejs`, `yarn`, herramientas de build, y todo lo que `bundle install` descargó. Nada de eso necesitas cuando el contenedor ya está corriendo — es como viajar con la caja de herramientas del taller adentro de la cajuela.

## Multi-stage builds: la idea

La idea es simple: usas múltiples `FROM` en el mismo Dockerfile. Cada `FROM` es una stage. Puedes copiar archivos de una stage a otra con `COPY --from=<stage-name>`. La imagen final solo contiene la última stage.

```dockerfile
# Stage 1: build
FROM ruby:3.3 AS builder
# ... instala todo lo necesario para compilar y empaquetar

# Stage 2: runtime
FROM ruby:3.3-slim AS runtime
# ... solo copia lo que necesitas para correr
COPY --from=builder /app/vendor /app/vendor
COPY --from=builder /app/public /app/public
```

El registry solo publica la stage `runtime`. El `builder` se tira. Magia.

## El Dockerfile multi-stage para Rails

```dockerfile
# ==========================================
# Stage 1: Build
# ==========================================
FROM ruby:3.3 AS builder

# Variables de build
ARG RAILS_ENV=production
ENV RAILS_ENV=$RAILS_ENV

WORKDIR /app

# Instalar dependencias del sistema SOLO para compilar
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo los archivos de dependencias primero
# (esto aprovecha el layer cache — si Gemfile no cambió, no reinstala)
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

# Ahora copiar el resto de la app
COPY . .

# Precompilar assets
RUN SECRET_KEY_BASE=dummy bundle exec rails assets:precompile

# ==========================================
# Stage 2: Runtime
# ==========================================
FROM ruby:3.3-slim AS runtime

ARG RAILS_ENV=production
ENV RAILS_ENV=$RAILS_ENV \
    BUNDLE_WITHOUT="development test" \
    BUNDLE_PATH=/usr/local/bundle

WORKDIR /app

# Solo las librerías de runtime que necesitas (no build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar gems compilados del builder
COPY --from=builder /usr/local/bundle /usr/local/bundle

# Copiar la app (sin node_modules, sin source de assets)
COPY --from=builder /app /app

# Usuario no-root para seguridad
RUN useradd -m -u 1000 rails && chown -R rails:rails /app
USER rails

EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
```

Los números:

```sh
REPOSITORY   TAG        SIZE
my-rails-app builder    1.89GB  (nunca se publica)
my-rails-app runtime    387MB   ← esto va al registry
```

387MB vs 2.14GB. 82% de reducción.

## El equivalente para Node.js

```dockerfile
# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# ==========================================
# Stage 2: Builder (si necesitas compilar TS, Next.js, etc.)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci  # instala devDependencies también para el build

COPY . .
RUN npm run build  # TypeScript, Next.js, lo que sea

# ==========================================
# Stage 3: Runtime
# ==========================================
FROM node:22-alpine AS runtime

WORKDIR /app

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copiar solo lo necesario
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY package.json ./

USER nextjs
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```sh
REPOSITORY   TAG        SIZE
my-node-app  runtime    142MB  # vs ~900MB naïve
```

## `.dockerignore` no es opcional

Sin `.dockerignore`, el `COPY . .` incluye todo tu directorio de trabajo — incluyendo cosas que nunca deberían estar en una imagen:

```dockerignore
# .dockerignore
.git
.gitignore
.env
.env.*
node_modules
npm-debug.log
tmp/
log/
coverage/
.bundle
vendor/bundle
*.md
Dockerfile*
docker-compose*
.dockerignore
spec/
test/
```

El impacto más grande: `node_modules` y `vendor/bundle` pueden ser cientos de MB. Si los copias al builder y los vuelves a generar, estás haciendo trabajo doble y agrandando el contexto de build. `.dockerignore` elimina ese overhead.

Verifica que funciona:

```sh
docker build --no-cache --progress=plain . 2>&1 | grep "transferring"
# Transferring context: 12.3MB ← con .dockerignore
# Transferring context: 834.2MB ← sin .dockerignore
```

## Alpine vs slim: cuál elegir

| Base Image | Tamaño | Compatibilidad | Recomendación |
|-----------|--------|---------------|---------------|
| `ruby:3.3` | ~900MB | Excelente | Solo para build stage |
| `ruby:3.3-slim` | ~200MB | Muy buena | Runtime ideal para Ruby |
| `ruby:3.3-alpine` | ~60MB | Problemática | Evítala con gems nativos |
| `node:22` | ~1.1GB | Excelente | Solo para build |
| `node:22-slim` | ~250MB | Muy buena | Runtime para Node |
| `node:22-alpine` | ~170MB | Buena | OK si no hay addons nativos |

Alpine usa `musl libc` en lugar de `glibc`. La mayoría de los gems de Ruby con extensiones nativas (nokogiri, pg, bcrypt) están compilados para glibc. Puedes hacer que funcione con Alpine, pero requiere compilar desde source y el build es más lento y frágil.

Para Ruby: `ruby:X.X-slim` en runtime. Para Node: `node:XX-alpine` si no tienes addons nativos.

---

Multi-stage builds son una de esas cosas donde el esfuerzo inicial de reescribir el Dockerfile se recupera inmediatamente: menos tiempo de pull en deploys, menos GB en el registry, y una superficie de ataque más pequeña porque no tienes compiladores en producción.

`.dockerignore` también — ponlo desde el día uno, no el día que alguien se queje de que el build tarda 5 minutos y descubres que estás copiando `node_modules` al contexto de Docker.

387MB vs 2.1GB. El Dockerfile más largo fue la mejor inversión del sprint.
