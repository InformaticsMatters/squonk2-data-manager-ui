# 4. Persistent chrome belongs to composition

Date: 2026-08-19

## Status

Accepted. Delivered by [#1982](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1982),
closing #1968 and #1978.

## Context

Every screen rendered the layout for itself. The masthead, workspace navigation, project identity
strip, footer and event stream sidebar were therefore inside the family boundary that a page policy
composes — a boundary keyed on family and section, wrapping a Suspense fallback that covered the
whole page. Both consequences followed from that one placement:

- A workspace or section change reset the keyed boundary, so the chrome was replaced by a centred
  loader and rebuilt. The route-transition progress bar beneath the masthead could never appear,
  because the layout that renders it was itself inside the region being replaced.
- The event stream was mounted in the application shell, inside the same boundary and inside
  Suspense, so every navigation tore its connection down and opened a new one — announcing both
  with a toast for a connection that was never meant to be interrupted.

This also deviated from [ADR 2](0002-vertical-route-family-modules.md), which already says a page
cannot configure its own layout.

## Decision

The persistent chrome is a layer of the page composition, not something a screen renders. It is
mounted once, above the page policy branch, so one instance serves public, application and family
policies alike; a screen returns only its own content.

The composition order is: chrome error boundary, route resolver, layout, then the policy branch. A
family branch continues: route gate, authentication, API-client readiness, application shell, family
error boundary, family Suspense, family shell, content.

- **The application shell — which mounts the event stream — sits above the family error boundary and
  above Suspense.** Its connection is opened once per authenticated session and survives every
  workspace change, section change and family crash.
- **The family error boundary is keyed on the family alone.** Keying on the family retains the
  isolation that matters — a crashed workspace resets when the caller leaves it — while a section
  change no longer resets the family's subtree, its route context or its cached reads.
- **Route resolution is separated from route gating.** A universal resolver runs above the layout
  and publishes the resolved route, so the chrome can read it; a gate runs beneath the layout, in
  the family branch, and renders not-found, canonicalisation failure and pending. One provider owns
  the canonicalisation replace-navigation, so exactly one component ever tries to canonicalise a
  URL. The gate stays above authentication: a malformed URL is refused as malformed whether or not
  the caller is signed in.
- **A chrome error boundary is the outermost layer.** Once the layout is above every other boundary,
  a throw from the masthead, footer or sidebar escapes them all, and the family failure fallback now
  renders inside the chrome. Its fallback renders a plain error page and no chrome: the outermost
  fallback must not depend on anything it might be catching.
- **The declared composition layers name every boundary that exists**, so the order is reviewable
  without reading the render tree.

## Consequences

- Not-found and server-failure states appear inside the chrome rather than in place of it. A caller
  who mistyped an address has somewhere to go from it.
- The project read no longer refetches on every section change. This is the point of keying on the
  family, but it is a real change in request volume and timing.
- The chrome renders above the boundary that resolves the URL project, so it cannot receive that
  project as context. The resolution is published upward instead (`src/projects/routeProjectResolution.ts`),
  which is why the identity strip has a loading treatment of its own and reserves the unavailable
  wording for an actual failure. This continues the standing tension ADR 2 names: the chrome reads
  the Projects family's scope, and that arrangement predates this decision.
- Two invariants are not observable through the running application and are asserted structurally
  over the composition factories: that the application shell sits above the family boundaries, and
  that the chrome fallback contains no chrome. Everything else a caller can see is asserted at the
  acceptance seam, including that the chrome nodes are never removed during a navigation.
