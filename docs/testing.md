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

`pnpm test:smoke` retains the tests that use mutable Keycloak, Data Manager, and Account Server deployments. It requires `.env.test.local`, a production build made with those endpoints, and live credentials. The scheduled/manual `live-service-smoke` workflow is non-blocking and is not an ordinary merge gate.
