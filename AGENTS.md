# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`data-manager-ui` is a Next.js app.

## Monorepo vs Polyrepo

The app has its own git repository (InformaticsMatters/squonk2-data-manager-ui), usually a submodule inside the `squonk-frontend` pnpm-workspace monorepo — a **separate** repository with a different remote. This may not always be the case. The app can be developed as a standalone repo `squonk2-data-manager-ui` or as a `data-manager-ui` submodule. When it is a submodule, shared code lives in `../../libs/` (`@squonk/*` packages, e.g. `mui-theme`, `sdf-parser`, `eslint-config`).

## Stack

- Next.js 16 using the **Pages Router** (`src/pages/`), not the App Router.
- React 19, Material-UI v9, Emotion (CSS-in-JS, `jsxImportSource: @emotion/react`), TanStack Query/Form/Table.
- Package manager: **pnpm** (Node 24). Run commands from this app directory.
- Auth: better-auth client using keycloak on the front-end
- API clients are generated with Orval and committed as application source under `src/api/data-manager` and `src/api/account-server`. Import their root, tag, Fetch, and Zod interfaces through `@/api/...`; keep handwritten runtime adapters under `src/api/runtime` outside the replaceable generated trees.

## Commands

- `pnpm dev` — dev server (uses `--webpack`, not Turbopack).
- `pnpm build` — production build. Run the separate strict TypeScript and ESLint commands too.
- `pnpm generate:client:data-manager` / `pnpm generate:client:account-server` — regenerate one local OpenAPI client from its ignored input in `openapi/`.
- `pnpm generate:clients` — transactionally regenerate both local OpenAPI clients.
- `pnpm tsc` — typecheck only (`tsc --noEmit`).
- `pnpm lint` / `pnpm format` — ESLint with `--max-warnings=0`. **Any warning fails CI**, so leave the tree warning-free.
- `pnpm test` — Playwright E2E tests and unit tests.

## Testing quirks

- `pnpm test:acceptance` (`tests/acceptance/*.acceptance.ts`) is the ordinary gate: deterministic, needs no external services or credentials. See `docs/testing.md`.
- `playwright.config.ts` runs the pure contract matrices (`tests/contracts/*.node.ts` and the other `*.node.ts` files). `pnpm test` runs the acceptance gate and then these.
- `pnpm test:smoke` (`playwright.smoke.config.ts`) runs the live suite — a real Keycloak login/logout (`*.setup.ts`) and public navigation (`tests/navigation.browser.ts`). Those hit **real external APIs** and load `.env.test.local`; the workflow is non-blocking and CI skips it when the APIs are down.

## Setup gotchas

- Copy `.env.local.example` → `.env.local`. Requires Keycloak, better-auth, and API server vars to run.
- Protobuf types in `src/protobuf/gen` are generated from `src/protobuf/proto` via buf (`buf.gen.yaml`) — regenerate after editing `.proto` files.
- Type-safe route types (`nextjs-routes`) and Sentry instrumentation (`src/instrumentation.ts`) are generated/wired automatically.
- apps/data-manager-ui/assets is a git subtree

## Conventions

- **Conventional commits** are required — `semantic-release` drives versioning. Pushes to `dev` cut prerelease tags (`X.Y.Z-dev.N`), `master` cuts stable releases.
- Prettier: double quotes, `printWidth: 100`, trailing commas, 2-space indent. Husky + lint-staged format and lint on commit.

## Deployment

- Vercel builds preview and production deployments straight from the repo, with its environment variables held in the Vercel project.
- Live Kubernetes deployments run the published Docker image through a **separate** Ansible repository, `InformaticsMatters/squonk2-data-manager-ui-ansible` (role `ui`). `release.yml` pushes the image and then triggers an AWX job template — prereleases to the test AWX, stable releases to production — passing the new version as the image tag.
- That playbook delivers runtime configuration as a ConfigMap mounted over `/app/.env.production`, rather than as container environment variables. It writes deployment-facing names (`BASE_URL`, `BASE_PATH`, `KEYCLOAK_URL`, the API servers, the Keycloak client credentials); the image's committed `.env` derives the names the app actually reads from those, so renaming a variable the app reads means changing the playbook too.
- `NEXT_PUBLIC_*` values are inlined by `next build`, so a running container cannot change them — the image build receives only `GIT_SHA` and `BASE_PATH`.

## Agent skills

### Issue tracker

Issues for the data-manager-ui live in this app's own repository, `InformaticsMatters/squonk2-data-manager-ui`. `gh` resolves the repository from the working directory, so run every `gh` command from this app directory. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five canonical engineering-skill labels. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses a single-context layout. See `docs/agents/domain.md`.

### Playwright CLI

Use the playwright-cli to use the browser
