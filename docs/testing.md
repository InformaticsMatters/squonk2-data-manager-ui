# Testing

## Deterministic acceptance

`pnpm test:acceptance` is the ordinary production acceptance gate. It needs no external services or credentials. The command:

1. Defines fixed local OIDC, Data Manager, and Account Server endpoints.
2. Supplies the same endpoints before the webpack production build and Next server start.
3. Starts test-only HTTP fixtures outside the browser.
4. Runs Playwright against the production server under `/data-manager-ui`.

Run one journey or use a visible browser by forwarding Playwright arguments:

```bash
pnpm test:acceptance -- services.acceptance.ts -g "logs in"
pnpm test:acceptance:headed
```

The fixed ports are `4310` for Next, `4311` for OIDC, `4312` for Data Manager, `4313` for Account Server, and `4314` for fixture control and diagnostics. A startup error naming one of these ports means another local process must be stopped first.

### Scenario isolation

Each Playwright worker logs in as `acceptance-worker-<parallelIndex>`. The OIDC subject is carried by the real bearer token, and the fixture services use that subject to select independent state. Tests reset their subject through `PUT http://127.0.0.1:4314/scenario/<subject>`.

The fixture catalogue uses generated Zod schemas and includes deterministic identities, organisation/unit ancestry, memberships, project roles, HTTP failures, binary bytes, multipart upload capture, and polling transitions. Read diagnostics with `GET` on the same scenario URL; the response contains request records, polling progress, and upload metadata.

Playwright retains traces, screenshots, and video for failures under `test-results/acceptance`. Fixture and Next server output is piped into the Playwright run for startup and request diagnostics.

## Live smoke evidence

`pnpm test:smoke` retains the tests that use mutable Keycloak, Data Manager, and Account Server deployments. It requires `.env.test.local`, a production build made with those endpoints, and the password of the identity pinned in `tests/liveEnvironment.ts` (`DMIT_USER_A_PASSWORD`). The scheduled/manual `live-service-smoke` workflow is non-blocking and is not an ordinary merge gate.

## Live user journey

`pnpm test:journey` runs one mutating journey — a whole new user's working life — against the DLS test deployment: sign-in, personal unit, project and subscription, an upload, a job, a workflow, an application, membership, the charges ledger, and deleting it all again. It is manual and scheduled only (`live-user-journey`, weekly, non-blocking) and is **never a merge gate**; what each screen does is specified deterministically in `tests/acceptance`, and a regression this journey catches should be reproduced there.

- One serial test of eleven steps sharing one sign-in, with `retries: 0`: a second attempt would start from the first attempt's leftovers.
- `tests/journey/preparation.setup.ts` runs first as its own Playwright project. It clears the journey user's projects, subscriptions and personal unit **before** the run, so a failed run's residue survives as evidence until the next run removes it, and it warms every identity up with one authenticated read per service, because the Data Manager offers a project's membership only the users it has already met.
- Preparation talks to the services directly with a Keycloak direct-access-grant token per identity. The token must request `openid` alongside `profile` and `email`: without it the Account Server answers `403` on `/personal-unit` while `/organisation` still succeeds. It must **not** request `offline_access` — nothing in preparation refreshes, and Keycloak refuses the whole grant for an identity without that realm role.
- The deployment facts it depends on — job, workflow, application, tier and the collaborator it shares with — are pinned in `tests/journey/deployment.ts`, and the user whose workspace it clears is the one both live suites sign in as, in `tests/liveEnvironment.ts` rather than discovered, so "this deployment no longer offers an application" cannot look like "the Run catalogue is broken".
- Every step starts by loading the page again, and the long waits poll by reloading. A run outlives the deployment's five-minute access token, and the application asks for one as it starts up, so re-reading the page is what keeps the journey signed in.
- It needs the same `.env.test.local` as the smoke suite plus `DMIT_USER_B_PASSWORD` for the collaborator, and a production build made with those endpoints.

## Component tests

`pnpm test:components` runs the `components` project of `playwright.config.ts` (`tests/components/*.spec.ts`). It uses Playwright's built-in `mount` fixture, which needs no component-testing runtime, no bundler integration and no extra test packages — only a **story gallery** page to render into.

- A **story** is a small wrapper component that puts the component under test in one scenario: hard-coded props, mock data, providers, recorded callbacks. Stories live next to the component in `src/**/*.story.tsx`, one named export per scenario.
- The **gallery** is `playwright/gallery/` (an `index.html` and a `main.tsx`). It discovers stories with `import.meta.glob`, and exposes `window.mount({ story, props })` / `window.unmount()`, rendering into `#root`. It reuses the React root so `component.update(props)` re-renders without remounting and component state survives.
- The gallery is served by Vite (`playwright/vite.config.mts`, port `3100`), because the app itself is built by Next with webpack and does not serve arbitrary HTML entry points. That config mirrors the three things component source depends on: the `@/*` alias, the Emotion JSX runtime, and the `process.env` that Next's own client modules read as they are evaluated — `next/link` is reached by any component rendering an internal link, and without that define it throws `process is not defined` before a story renders.

A story id is the path under `src/` without the `.story.*` extension, plus the export name — `src/components/WarningDeleteButton.story.tsx` export `Confirming` is `components/WarningDeleteButton/Confirming`. Any unique trailing suffix also resolves.

```ts
const component = await mount("components/WarningDeleteButton/Confirming");
await component.getByRole("button", { name: "Delete" }).click();
```

`mount` returns a locator for `#root`, so queries are scoped from it. MUI renders dialogs, menus and tooltips into a portal on `document.body`, **outside** that root — reach those through `page` instead.

Everything the component needs is set up inside the story, and everything a test asserts has to be observable through the page. Where a component takes callbacks, the story owns the state, provides the callbacks and records the result into a hidden form the test reads with `toHaveValue()`. Providers come from `AppScaffold` in `src/stories/decorators.tsx`, wrapped in the story rather than imposed by the gallery, so a story can opt out.

Run `pnpm test:gallery` and open <http://localhost:3100/playwright/gallery/index.html> to browse every story by hand; the page lists them, and `?story=<id>` mounts one. In the devtools console, `await window.mount({ story: "..." })` is exactly what the fixture does.
