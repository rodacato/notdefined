---
title: "Kamal: deploy de Rails sin la complejidad de Kubernetes"
description: "Kamal (antes MRSK) llega por defecto con Rails 8 y usa Docker en cualquier VPS sin necesitar Kubernetes. Qué problema resuelve, cómo se compara con Heroku/Fly/Render, zero-downtime deploys, y cuándo todavía tiene sentido una plataforma managed."
pubDate: 2026-02-24
tags: ["ruby", "rails", "devops", "docker"]
draft: false
series: "Rails 8 Stack"
seriesOrder: 3
---

## TL;DR

- **Kamal** es un deployment tool que usa Docker en cualquier VPS — piensa en Heroku pero en tu propio servidor
- **Zero-downtime deploys** por defecto con el proxy integrado (kamal-proxy, basado en Traefik)
- La gran ventaja sobre plataformas managed: **control total** del servidor a una fracción del costo
- La gran desventaja: **tú gestionas el servidor** — actualizaciones de OS, monitoring, backups, etc.
- Heroku/Fly/Render siguen ganando cuando el equipo es muy pequeño o el tiempo de ops es un recurso escaso

---

## El problema que Kamal resuelve

Antes de Kamal (y antes de que fuera MRSK), las opciones para deploy de Rails eran:

1. **Heroku** — simple, caro a escala, limitado en configuración
2. **Fly.io / Render** — más barato, más flexible, pero sigues pagando el premium de plataforma managed
3. **Kubernetes** — máximo control, máxima complejidad operacional, equipo dedicado de DevOps
4. **Capistrano en VPS** — el clásico Rails, requiere configuración manual significativa, y parece código de 2010 porque efectivamente lo es

Había un hueco enorme entre "pago $200/mes por que alguien más gestione mis contenedores" y "dedico 3 meses a aprender Kubernetes". Kamal llena ese espacio: deploy automatizado en tus propios VPS, con Docker, con zero-downtime, sin un equipo de infraestructura.

## Cómo funciona internamente

Kamal no es un orquestador de contenedores — es un deployment tool. La diferencia es importante:

```
Kubernetes: gestiona contenedores, scheduling, networking, storage, etc.
Kamal: construye imagen → la sube al registry → la corre en los servidores con Docker
```

El flow de un `kamal deploy`:

```
1. Build de la imagen Docker en tu máquina (o en CI)
2. Push al registry (GHCR, DockerHub, etc.)
3. SSH a cada servidor
4. Pull de la nueva imagen
5. kamal-proxy drena el tráfico del contenedor viejo
6. Levanta el nuevo contenedor
7. Health check pasa → kamal-proxy envía tráfico al nuevo contenedor
8. Mata el contenedor viejo
```

Sin downtime porque kamal-proxy mantiene el tráfico fluyendo durante el cambio.

## Setup desde cero

```sh
# Instalar kamal
gem install kamal

# En tu proyecto Rails 8 ya viene configurado
# Para proyectos existentes:
kamal init
```

```yaml
# config/deploy.yml
service: myapp
image: ghcr.io/myuser/myapp

servers:
  web:
    hosts:
      - 123.45.67.89  # IP de tu VPS
    labels:
      traefik.http.routers.myapp.rule: Host(`myapp.com`)

  workers:
    hosts:
      - 123.45.67.89
    cmd: bundle exec rake solid_queue:start

proxy:
  ssl: true        # Let's Encrypt automático
  host: myapp.com

registry:
  server: ghcr.io
  username: myuser
  password:
    - KAMAL_REGISTRY_PASSWORD  # de .env o secrets

env:
  clear:
    RAILS_ENV: production
    DB_HOST: 123.45.67.89
  secret:         # se leen del entorno local o CI
    - RAILS_MASTER_KEY
    - DATABASE_URL
    - REDIS_URL

accessories:
  db:
    image: postgres:16
    host: 123.45.67.89
    port: 5432
    env:
      secret:
        - POSTGRES_PASSWORD
    volumes:
      - /var/lib/postgres/data:/var/lib/postgresql/data

  cache:
    image: redis:7
    host: 123.45.67.89
    port: 6379
```

```sh
# Primera vez: configura el servidor (instala Docker, etc.)
kamal setup

# Deploys posteriores
kamal deploy

# Ver logs en tiempo real
kamal app logs -f

# Rollback al release anterior
kamal rollback

# Ver qué está corriendo
kamal app details
```

## SSL gratis con Let's Encrypt

kamal-proxy maneja los certificados de Let's Encrypt automáticamente:

```yaml
proxy:
  ssl: true
  host: myapp.com
  # Kamal gestiona renovación automática
```

Sin configurar Certbot, sin cron jobs para renovar, sin nginx config manual. Funciona.

## Gestión de secrets

Kamal lee secrets del entorno local (tu `.env`) durante el deploy y los pasa a los contenedores:

```sh
# .env (nunca al repo)
RAILS_MASTER_KEY=abc123...
DATABASE_URL=postgres://...
KAMAL_REGISTRY_PASSWORD=ghp_...
```

```yaml
# config/deploy.yml
env:
  secret:
    - RAILS_MASTER_KEY    # se lee de .env en tu máquina
    - DATABASE_URL
```

Para CI/CD, los mismos secrets van como GitHub Actions secrets y Kamal los lee del entorno del runner.

## Kamal vs las alternativas: los números reales

Para una app con ~50K requests/día, PostgreSQL, Redis, background workers:

| Plataforma | Costo/mes | Control | Ops overhead |
|-----------|-----------|---------|-------------|
| Heroku (Basic dynos) | $50–200 | Bajo | Mínimo |
| Fly.io | $30–100 | Medio | Bajo |
| Render | $40–150 | Medio | Bajo |
| Kamal en Hetzner VPS | $10–30 | Alto | Medio |
| Kubernetes (GKE/EKS) | $150–500+ | Máximo | Alto |

La diferencia de costo entre Kamal en Hetzner y Heroku es 5-10x. Para una app bootstrapped o un proyecto personal, eso es significativo. Para una empresa con 50 empleados, probablemente no.

## Lo que Kamal no hace (y nadie te dice en el README)

**No es un orquestador**. Si un contenedor muere, Docker no lo reinicia automáticamente (aunque puedes configurar `restart: unless-stopped`). Para high-availability real con múltiples servidores y failover automático, necesitas algo más.

**No gestiona tu base de datos de producción**. El accessory de postgres en Kamal es conveniente para dev/staging, pero para producción de verdad probablemente quieres un managed PostgreSQL (RDS, Supabase, Neon) con backups automáticos, replicación, y monitoring incluidos.

**No incluye monitoring**. Necesitas configurar separadamente: métricas (Grafana/Prometheus o Datadog), logs agregados (Papertrail, Logtail), y alertas. Las plataformas managed lo incluyen.

**Tú parcheas el OS**. Actualizaciones de seguridad, gestión de SSH keys, firewall — todo eso es tu responsabilidad.

## Cuándo Kamal es la respuesta correcta

**Equipos con algo de expertise DevOps** que quieren control sobre la infraestructura sin pagar el premium de managed hosting. Si alguien del equipo sabe configurar un servidor Linux y Docker, Kamal amplifica eso.

**Proyectos con presupuesto ajustado** — bootstrapped, side projects, startups pre-revenue. La diferencia de costo es real.

**Apps Rails bien containerizadas** — si ya tienes un `Dockerfile` limpio y tu app corre bien en Docker localmente, Kamal es literalmente `kamal setup && kamal deploy`.

## Cuándo las plataformas managed siguen ganando

**Equipo muy pequeño sin ops experience**. Si nadie en el equipo quiere tocar servidores, el tiempo de aprendizaje de Kamal supera el ahorro de costo.

**Apps que ya viven en Heroku/Fly y funcionan bien**. Migrar por migrar no tiene sentido. Si el costo no es un problema y estás contento, no hay razón para moverse.

**Cuando necesitas features de plataforma**: review apps automáticos, databases managed con backups y point-in-time recovery, métricas y alertas incluidas, soporte 24/7 para incidentes de infraestructura.

---

Kamal democratiza el "deploy a tu propio servidor" de una forma que Capistrano nunca logró del todo. El zero-downtime, el SSL automático, y la integración con el ecosystem de Docker hacen que el tradeoff de control vs simplicidad valga la pena para muchos proyectos.

Pero no es magia — sigues siendo responsable del servidor. Si tu VPS muere a las 3am, no hay soporte que llamar. Esa responsabilidad tiene un costo en tiempo (y posiblemente en sueño), y es el costo real que tienes que evaluar contra el ahorro de dinero. Si esa ecuación funciona para ti: `kamal setup && kamal deploy`. Si no: Fly.io no es ninguna vergüenza.
