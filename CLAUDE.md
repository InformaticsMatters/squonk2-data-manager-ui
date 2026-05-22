# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`data-manager-ui` is a Next.js app inside the `squonk-frontend` pnpm-workspace monorepo. Shared code lives in `../../libs/` (`@squonk/*` packages, e.g. `mui-theme`, `sdf-parser`, `eslint-config`).

## Stack

- Next.js 16 using the **Pages Router** (`src/pages/`), not the App Router.
- React 19, Material-UI v9, Emotion (CSS-in-JS, `jsxImportSource: @emotion/react`), TanStack Query/Form/Table.
- Package manager: **pnpm** (Node 24). Run commands from this app directory.

## Commands

- `pnpm dev` — dev server (uses `--webpack`, not Turbopack).
- `pnpm build` — production build; runs TypeScript + ESLint checks.
- `pnpm tsc` — typecheck only (`tsc --noEmit`).
- `pnpm lint` / `pnpm format` — ESLint with `--max-warnings=0`. **Any warning fails CI**, so leave the tree warning-free.
- `pnpm test` — Playwright E2E tests (the only tests; no unit tests).

## Testing quirks

- Tests are split by filename suffix into Playwright projects: `*.setup.ts`, `*.browser.ts`, `*.browser-authenticated.ts` (depends on login/`storageState.json`), `*.node.ts`.
- Tests hit **real external APIs** and load `.env.test.local`; CI health-checks the APIs first and skips when they're down.

## Setup gotchas

- Copy `.env.local.example` → `.env.local`. Requires Keycloak, better-auth, and API server vars to run.
- Protobuf types in `src/protobuf/gen` are generated from `src/protobuf/proto` via buf (`buf.gen.yaml`) — regenerate after editing `.proto` files.
- Type-safe route types (`nextjs-routes`) and Sentry instrumentation (`src/instrumentation.ts`) are generated/wired automatically.

## Conventions

- **Conventional commits** are required — `semantic-release` drives versioning. Pushes to `dev` cut prerelease tags (`X.Y.Z-dev.N`), `master` cuts stable releases.
- Prettier: double quotes, `printWidth: 100`, trailing commas, 2-space indent. Husky + lint-staged format and lint on commit.
