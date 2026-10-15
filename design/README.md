# Design — notdefined.dev

> Index of the design material. Brand source lives in [`brand/`](brand/README.md); this level holds the design-system docs built on top of it.

| File | Purpose |
|------|---------|
| [`brand/README.md`](brand/README.md) | Brand guide entry point: identity, logo, color, type, voice, asset map |
| [`brand/tokens.md`](brand/tokens.md) | Canonical color, typography and spacing tokens (mirror of `src/styles/global.css`) |
| [`brand/portable-kit.md`](brand/portable-kit.md) | Single-file pegable kit for Claude Design / Stitch / v0 |
| [`components.md`](components.md) | Recipes for PageHeader, CardList, TagPill and CSS primitives |
| [`prompts.md`](prompts.md) | Ready-to-paste prompts for generating screens with AI design tools |

Runtime copies of brand assets (`public/logo.png`, `public/favicon.ico`, `public/apple-touch-icon.png`) stay in `public/`; see the asset map in [`brand/README.md`](brand/README.md#asset-map). Generated bundles go to `design/brand/dist/` (gitignored).
