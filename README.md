# SolarZmanim

Production-ready React/Vite application for halachic zmanim, Hebrew calendar
information, weather, sun/moon visualization, exports, and saved locations.

## Local development

Requirements: Node.js 20 or 22 and npm.

1. Copy `.env.example` to `.env.local`.
2. Fill in the public Base44 application values.
3. Run `npm ci`.
4. Run `npm run dev`.

## Quality checks

Run `npm run check` before publishing. It runs linting, module checks, core
date/DST/astronomy tests, configuration validation, edge-function syntax
validation, and a production build.

## Cloudflare Pages

See [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md) for the GitHub deployment
steps and the settings for `solarzmanim.app`.

## Base44 editing

The source remains compatible with Base44's GitHub integration. Backend
functions and Base44-managed data continue to live in the connected Base44 app.
