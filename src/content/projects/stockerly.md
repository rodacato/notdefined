---
name: Stockerly
tagline: Tus inversiones en USD y MXN, con el tipo de cambio que sí era.
product: >-
  Tracker self-hosted de un solo usuario para acciones en USD, cripto y CETES.
  Cada operación guarda el tipo de cambio de Banxico de su propia fecha, así que
  separa lo que hizo el activo de lo que hizo el peso. Consolidado con retorno
  ponderado en el tiempo contra CETES reinvertidos, TrendScore de 5 factores,
  alertas y captura de operaciones con importación CSV revisable. Open source,
  licencia MIT.
technical: >-
  Rails 8 con Hotwire y Tailwind 4 sobre PostgreSQL, instalable como PWA. DDD
  pragmático + arquitectura hexagonal en 6 bounded contexts que solo se cruzan
  por eventos de dominio. Gateways de datos de mercado (Alpaca, Finnhub,
  CoinGecko, DataBursatil, Banxico y otros) en cadenas con circuit breakers y
  scheduling adaptativo. 2FA con TOTP y un error tracker dentro de la instancia.
stack:
  - Ruby
  - Rails
  - DDD
  - Hexagonal
  - Hotwire
  - PostgreSQL
  - Tailwind CSS
  - PWA
repo: https://github.com/rodacato/stockerly
site: https://rodacato.github.io/stockerly/
accent: '#10b981'
icon: /projects/icons/stockerly.svg
image: /projects/shots/stockerly.webp
order: 1
posts:
  - /blog/pwa-como-alternativa-economica-a-una-app-nativa/
---
