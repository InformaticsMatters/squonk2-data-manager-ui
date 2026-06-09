# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Squonk 2 Data Manager UI — a Next.js (Pages Router) web app for the Informatics Matters Data Manager. It talks to two backend APIs: the **Data Manager (DM) API** and the **Account Server (AS) API**. UI major versions are pinned to specific API versions (see the compatibility table in `README.md`); a UI major bump corresponds to a major change in one of those APIs.

## Commands

Uses `pnpm` (Node >= 22, pnpm >= 10).

- `pnpm dev` — start the dev server. `pnpm dev:debug` runs it under the Node inspector (attach the VSCode debugger).
- `pnpm build` — production build. `pnpm start` — serve the production build.
- `pnpm tsc` — one-off type check (`tsc --noEmit`). Run this to verify types; the Next build itself ignores type/eslint errors (`ignoreBuildErrors`/`ignoreDuringBuilds` in `next.config.ts`).
- `pnpm lint` — eslint (`--max-warnings=0`). `pnpm format` — eslint `--fix`.
- `pnpm test` — Playwright tests. `pnpm test:debug` — headed/debug mode.
- Run a single test: `pnpm exec playwright test tests/datetime.node.ts` (or pass `-g "<title>"`).

First-time Playwright setup: `pnpm exec playwright install-deps && pnpm exec playwright install`.

`pnpm tsc` and `lint-staged` run on **pre-commit** (`.husky/pre-commit`). On `master`, the pre-commit hook also fails if `link:..` workspace links are present in `pnpm-lock.yaml`.

## Architecture

### API access: client + proxy

The app never calls the DM/AS APIs directly from the browser. Instead:

1. **Generated clients** — `@squonk/data-manager-client` and `@squonk/account-server-client` are external, orval-generated React Query clients (hooks like `useGetProjects`). Import data hooks from these packages (often subpath imports, e.g. `@squonk/data-manager-client/project`); types come from the package root.
2. **Base URLs** are set once in `src/pages/_app.tsx` via `setDMBaseUrl`/`setASBaseUrl` to local proxy paths (`/api/dm-api`, `/api/as-api`) defined in `src/constants/proxies.ts`.
3. **Proxy routes** — `src/pages/api/dm-api/[...dmProxy].ts` and `as-api/[...asProxy].ts` use `createProxyMiddleware` (`src/utils/api/apiProxy.ts`). The proxy reads the Auth0 access token server-side and injects `Authorization: Bearer <token>`, then forwards to the real API (`DATA_MANAGER_API_SERVER` / `ACCOUNT_SERVER_API_SERVER`). The browser bundle therefore never sees the token. Requests work unauthenticated too — the API enforces auth.

So: client hooks → local `/api/*-api` proxy → token injected → upstream API.

### Auth

Auth0 (`@auth0/nextjs-auth0`) fronts a Keycloak issuer. `src/pages/api/auth/[auth0].ts` provides login/logout/callback. `UserProvider` wraps the app in `_app.tsx`; hooks like `useKeycloakUser`, `useKeycloakIdToken`, `useIsAuthorized` expose user/authorization state. Project-level permissions are computed client-side in `src/hooks/projectHooks.ts` (`hasProjectRole`, `useHasProjectRole`).

### State & data

- **Server state**: TanStack React Query, provided in `_app.tsx`. SSR uses `HydrationBoundary` + `dehydratedState`; SSR query helpers live in `src/utils/api/ssrQueryOptions.ts` and `src/utils/next/ssr.ts`.
- **Client state**: Jotai atoms in `src/state/*` (e.g. `eventStream.ts`, `fileSelection.ts`, `notifications.ts`). `immer`/`use-immer` are used for complex updates (`enableMapSet()` is called in `_app.tsx`).

### Code organisation

- `src/pages/` — Next.js Pages Router routes. `_app.tsx` composes all top-level providers (theme, Auth0, React Query, snackbar, event stream, MDX). Routes are **typed** via `nextjs-routes`; generated route types land in `types/` (configured in `next.config.ts`). Use the typed route helpers rather than raw strings.
- `src/features/` — larger self-contained feature modules (e.g. `DatasetsTable`, `results`, `SDFViewer`, `Finance`).
- `src/components/` — reusable UI components.
- `src/hooks/` — shared hooks; `src/hooks/api/` wraps generated client mutations.
- `src/utils/` — `api/` (proxy, SSR, fetch helpers), `app/` (domain helpers: paths, products, datetime, coins), `next/` (emotion cache, localStorage, orval error handling).
- `src/layouts/` — page chrome (Header, Footer, navigation).
- `src/constants/` — shared constants (proxy URLs, auth, fonts, datetimes).

### Protobuf event stream

A live WebSocket event stream (`src/components/eventStream/`, `react-use-websocket`) carries billing/charge messages encoded with Protobuf. Schemas are in `src/protobuf/proto/*.proto`; TypeScript is generated into `src/protobuf/gen/` via `buf` + `protoc-gen-es` (`buf.gen.yaml`). Regenerate with `pnpm exec buf generate` after editing `.proto` files — do not hand-edit `gen/`.

### Styling & UI

MUI v7 with Emotion (`jsxImportSource: "@emotion/react"` — note this affects JSX typing). Shared theme is the external `@squonk/mui-theme`. Docs pages use MDX (`@next/mdx`) under `src/pages/docs/`. Forms use `@rjsf` (JSON Schema) and `@tanstack/react-form`. Chemistry: `ketcher-*` (structure sketcher) and `@squonk/sdf-parser` / Plotly for visualisation.

### Observability

Sentry is wired via `sentry.*.config.ts` and `withSentryConfig` in `next.config.ts` (source maps uploaded then deleted at build). `src/instrumentation.ts` is the Next instrumentation hook.

## Environment

Config is entirely env-driven (`.env.*` files; Kubernetes injects `.env` at runtime). Key vars: `DATA_MANAGER_API_SERVER`, `ACCOUNT_SERVER_API_SERVER`, `KEYCLOAK_URL`, `AUTH0_SECRET`/`AUTH0_CLIENT_ID`/`AUTH0_CLIENT_SECRET`, `NEXT_PUBLIC_BASE_PATH` (the app is served under a subpath, e.g. `/data-manager-ui` — use `withBasePath` from `src/utils/app/basePath.ts` when building URLs). See `.env.local.example`. `DANGEROUS__DISABLE_SSL_CERT_CHECK_IN_API_PROXY` is test-only.

## Testing (Playwright)

Tests live in `tests/`, split by **project** via filename suffix (`playwright.config.ts`):
- `*.node.ts` — Node-environment tests (no browser).
- `*.browser.ts` — unauthenticated browser tests.
- `*.browser-authenticated.ts` — authenticated; depend on `*.setup.ts` (login flow) which writes `storageState.json`. These retry up to 3×.

Test config loads `.env.test.local` (see `.env.test.local.example`; needs `PW_USERNAME`/`PW_PASSWORD`). The web server is started by Playwright via `pnpm start` and reuses an existing server if running.

## Releases

`semantic-release` with conventional commits (no manual version bumps; `package.json` version is managed automatically):
- `dev` branch → prerelease tags `X.Y.Z-dev.N` → test deployment.
- `master` branch → stable tags `X.Y.Z` → production deployment + `:stable` Docker tag.

The `/assets` folder is a git **subtree** of `InformaticsMatters/squonk-assets` — update with `git subtree pull --prefix assets <repo> main --squash`, not by editing in place.
