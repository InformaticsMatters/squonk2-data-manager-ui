# 5. A mutating live journey runs beside the deterministic acceptance gate

Date: 2026-09-10

## Status

Accepted. Delivered as `tests/journey`, `playwright.journey.config.ts` and the `live-user-journey`
workflow.

## Context

This repository deliberately moved its authenticated journeys off live services: `tests/acceptance`
proves what each screen does against fixtures, deterministically and with no credentials, and the
live suite was cut back to a real Keycloak sign-in and public navigation because live journeys were
flaky and were not a merge gate anyone could trust.

That leaves one thing unproven. Every acceptance journey is answered by fixtures the repository
writes, so nothing establishes that a real Data Manager and Account Server still carry a complete
user journey — onboarding, execution, membership, billing and deletion — end to end. The failures
that would remain invisible are exactly the ones fixtures cannot model: a contract that drifted, a
subscription flavour withdrawn, an endpoint whose authorization changed.

## Decision

Add one **live journey**: a single serial Playwright test, run manually or on a schedule, never a
merge gate, that performs the whole of a new user's working life against the DLS test deployment.

- **One test, eleven steps.** Each step stands on the one before it, so they share a context and a
  sign-in rather than rebuilding the prefix eleven times. `retries: 0`, because a second attempt
  would start from the first attempt's leftovers.
- **The workspace is cleared before the run, not after.** The journey user's projects,
  subscriptions and personal unit are deleted by a pre-run project the journey depends on. A failed
  run's residue is evidence, and the next run's preparation removes it. Cleaning up afterwards
  would run cleanup code against a half-broken state and destroy the evidence.
- **Preparation talks to the services directly**, with a Keycloak direct-access-grant token per
  identity — no browser, no application. What the application does is what the journey itself
  exercises; preparation only establishes the state it starts from. The one exception to UI-only
  operation inside the journey is terminating a leaked application instance, which costs coins.
- **Every identity the journey names is warmed up first** by one authenticated read per service.
  The Account Server only knows a user once they have reached it, and a user it does not know
  cannot be added to a project's membership, so a database reset behind us would otherwise break
  the sharing steps rather than the application.
- **Deployment facts are pinned, never discovered.** The job, application, workflow, tier and
  collaborator identities are constants. Discovery would make "this deployment no longer offers an
  application" and "the Run catalogue is broken" look identical.
- **Executions are asserted as far as their cost allows.** The no-op job and the workflow are
  followed to a terminal state; the application is only asserted to be running, and is then
  terminated, because a running notebook spends the subscription's coins for as long as it lives.
- **Charges are asserted as a ledger that renders, not as rows that exist.** Whether a charge has
  settled minutes after the work ran is billing timing, not this application's behaviour.

## Consequences

- The suite mutates a shared test deployment as a real user, and adds real people's neighbours to a
  real project. Delivery found the deployment holds one usable test identity besides the journey
  user's own, so the journey grants a single role rather than the three the decision above assumed,
  and every identity it names — its own user included — is pinned beside the other deployment
  facts. It is scheduled and manual only, and its failures are not a signal to
  block a merge.
- Preparation must request the `openid` scope alongside `profile` and `email`. Without it the same
  credentials get a token the Account Server answers `403` to on resources such as
  `/personal-unit`, claiming the token carries no scopes at all, while `/organisation` still
  succeeds — a failure that reads as a permissions problem and is not one.
- It must not request `offline_access`, which delivery found the decision above had wrong. Nothing
  in preparation refreshes a token, and an identity Keycloak will not issue an offline token to has
  the whole grant refused with `not_allowed` — which is a reason to be signed out of a journey that
  never needed the scope.
- Delivery found the warm-up's reason to be narrower than stated above: the users a project's
  membership can name come from the **Data Manager**'s own user list, so an identity that has never
  reached the Data Manager cannot be added however well the Account Server knows it. The warm-up
  reads both services per identity, which covers either service forgetting.
- The live smoke suite's `setup` project is named exactly (`**/login.setup.ts`) rather than by
  `**/*.setup.ts`, so the journey's preparation — also a `.setup.ts` — cannot be swept into that
  read-only suite. Both configurations read their credentials through `tests/liveEnvironment.ts`.
- The deterministic acceptance gate remains the place where behaviour is specified. A regression
  the journey catches should be reproduced in `tests/acceptance` where it can be, rather than
  leaving the live suite as the only evidence of it.
