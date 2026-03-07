---
title: "GitHub Actions: CI/CD sin el drama"
description: "Una guía de supervivencia, no de referencia. Los conceptos que más tardan en clickear: jobs vs steps vs workflows, needs para ordering, matrix builds, caching correcto, y cómo debuggear sin hacer 40 commits."
pubDate: 2025-12-02
tags: ["github-actions", "devops", "ci-cd"]
draft: false
---

## TL;DR

- **Workflows** se componen de **jobs**, que se componen de **steps** — entender esa jerarquía es el 80% del modelo mental
- **`needs`** define dependencias entre jobs — sin él, todos los jobs corren en paralelo
- **Matrix builds** para testear en múltiples versiones sin duplicar código
- **Caching de dependencias** correctamente puede reducir el tiempo de CI de 5 minutos a 1
- Para debuggear: `act` para correr localmente, `tmate` para SSH al runner, y `echo` estratégico

---

Si alguna vez hiciste 15 commits seguidos que decían "fix ci", "fix ci again", "please work", "ok seriously fix ci" — este post es para ti. El problema casi siempre es el mismo: no entender la diferencia entre workflows, jobs, y steps, y no saber que los jobs corren en paralelo por default.

## El modelo mental: workflows → jobs → steps

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]  # cuándo corre el workflow

jobs:                      # colección de jobs (corren en paralelo por defecto)
  test:                    # nombre del job
    runs-on: ubuntu-latest # qué máquina usar

    steps:                 # lista de acciones secuenciales dentro del job
      - uses: actions/checkout@v4    # action predefinida
      - name: Run tests              # step con nombre descriptivo
        run: bundle exec rspec       # comando shell
```

**Workflow** = el archivo YAML completo. Se dispara por eventos (push, PR, schedule).

**Job** = una "máquina virtual" que se levanta, corre sus steps, y se destruye. Cada job es independiente — no comparten filesystem ni estado.

**Step** = un comando o una action dentro de un job. Los steps en un job corren secuencialmente; si uno falla, el job falla.

El error más común al empezar: asumir que los jobs comparten estado. No lo hacen. Si haces `git clone` en el job A, el job B no tiene ese código — cada job empieza de cero.

## `needs`: ordenando la ejecución

Por defecto, todos los jobs en un workflow corren en paralelo. Para dependencias, usa `needs`:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bundle exec rspec

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bundle exec rubocop

  build:
    runs-on: ubuntu-latest
    needs: [test, lint]        # espera que test Y lint pasen
    steps:
      - uses: actions/checkout@v4
      - run: docker build .

  deploy:
    runs-on: ubuntu-latest
    needs: build               # solo corre si build pasó
    if: github.ref == 'refs/heads/master'  # solo en master
    steps:
      - run: ./deploy.sh
```

```
test ──┐
       ├── build ── deploy
lint ──┘
```

Sin `needs`: test, lint, y build corren en paralelo desde el inicio — el deploy podría intentar deployar código que no pasó los tests.

## Matrix builds

Para testear en múltiples versiones sin copiar el job:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ruby: ['3.2', '3.3', '3.4']
        # También puedes combinar dimensiones:
        # os: [ubuntu-latest, macos-latest]
        # ruby: ['3.2', '3.3']
        # → genera 6 combinaciones

    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ matrix.ruby }}
          bundler-cache: true
      - run: bundle exec rspec
```

Esto crea tres jobs independientes (uno por versión de Ruby) que corren en paralelo. Si Ruby 3.2 falla pero 3.3 y 3.4 pasan, ves exactamente cuál versión es el problema.

Para excluir combinaciones problemáticas:

```yaml
strategy:
  matrix:
    ruby: ['3.2', '3.3', '3.4']
    os: [ubuntu-latest, macos-latest]
    exclude:
      - ruby: '3.2'
        os: macos-latest  # esta combinación específica no nos importa
```

## Caching: la diferencia entre 5 minutos y 1 minuto

Sin cache, cada job descarga e instala todas las dependencias desde cero. Con cache:

```yaml
# Para Ruby/Bundler
steps:
  - uses: actions/checkout@v4

  - uses: ruby/setup-ruby@v1
    with:
      ruby-version: '3.3'
      bundler-cache: true  # esto maneja el cache automáticamente
      # La action cachea según Gemfile.lock
      # Si Gemfile.lock no cambió, usa el cache → ~30s en vez de ~3min

# Para Node.js
  - uses: actions/setup-node@v4
    with:
      node-version: '22'
      cache: 'npm'   # cachea node_modules según package-lock.json

# Cache manual (para casos más específicos)
  - uses: actions/cache@v4
    with:
      path: ~/.cache/pip
      key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
      restore-keys: |
        ${{ runner.os }}-pip-
```

El `key` es la clave del cache — si cambia, se invalida. `hashFiles('Gemfile.lock')` genera un hash del archivo: si Gemfile.lock cambia, el hash cambia, el cache se invalida, se reinstala todo.

## Secrets vs env vars vs outputs

```yaml
# Secrets — valores sensibles, solo disponibles como variables de entorno
# Se configuran en Settings → Secrets and variables → Actions
- run: ./deploy.sh
  env:
    DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}      # valor secreto
    API_TOKEN: ${{ secrets.PRODUCTION_API_TOKEN }}

# Variables de entorno normales — visibles en los logs
env:
  RAILS_ENV: test
  NODE_ENV: test

# Outputs — pasar valores de un step a otro dentro del mismo job
- name: Get version
  id: version
  run: echo "tag=$(git describe --tags)" >> $GITHUB_OUTPUT

- name: Use version
  run: echo "Deploying version ${{ steps.version.outputs.tag }}"

# Para pasar entre jobs (requiere outputs declarados en el job)
jobs:
  build:
    outputs:
      image_tag: ${{ steps.build.outputs.tag }}
    steps:
      - id: build
        run: |
          TAG=$(git rev-parse --short HEAD)
          echo "tag=$TAG" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    steps:
      - run: docker pull myapp:${{ needs.build.outputs.image_tag }}
```

## Un workflow completo para Rails

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    env:
      RAILS_ENV: test
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/myapp_test

    steps:
      - uses: actions/checkout@v4

      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true

      - name: Setup database
        run: |
          bundle exec rails db:create
          bundle exec rails db:schema:load

      - name: Run tests
        run: bundle exec rspec

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()  # sube aunque fallen los tests
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
      - run: bundle exec rubocop --parallel
```

## Debuggear sin hacer 40 commits

El loop "push → esperar → ver error → corregir → push" es agónico. Alternativas:

**`act` para correr workflows localmente:**

```sh
# Instala act (macOS)
brew install act

# Corre el workflow de CI localmente
act push

# Corre un job específico
act push --job test
```

`act` usa Docker para simular el entorno de GitHub Actions. No es 100% idéntico, pero atrapa el 80% de los errores sin hacer push.

**`tmate` para SSH al runner en tiempo real:**

```yaml
- name: Debug with tmate
  uses: mxschmitt/action-tmate@v3
  if: failure()  # solo si algo falló
  # Esto pausa el workflow y te da una URL SSH para conectarte
```

**`echo` estratégico:**

```yaml
- name: Debug environment
  run: |
    echo "Ruby version: $(ruby --version)"
    echo "Working directory: $(pwd)"
    ls -la
    env | grep -i rails | sort
```

---

GitHub Actions tiene una curva de aprendizaje rara — el YAML es simple pero los conceptos de jobs vs steps, caching, y secrets toman algo de tiempo. Una vez que tienes el modelo mental claro, el resto es documentación.

Instala `act` hoy. En serio — debuggear localmente te ahorra literalmente una hora de push-esperar-ver-error-corregir-push por cada workflow que configures. Que no sean tus commits de CI los que definen la historia de tu repo.
