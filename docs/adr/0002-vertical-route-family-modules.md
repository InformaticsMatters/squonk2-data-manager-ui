# 2. Organise the application as vertical route-family modules

Date: 2026-08-14

## Status

Accepted. Delivered by [#1914](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1914)
and its build tickets #1915–#1945.

## Context

Scope rules were previously spread across shared layouts, hooks and components, so no single module
could be held responsible for what a given URL meant. Making one route behave correctly meant edits
in several unrelated places, and there was nowhere obvious for a rule about a project to live that
a dataset screen could not also reach.

## Decision

Implementation is organised into three vertical route-family modules — `src/projects`,
`src/datasets`, `src/administration` — and each family owns, for its own routes:

- parsing, canonicalisation, the query allowlist and link building;
- its route and failure boundaries;
- composition hooks over the generated clients;
- its capability evaluators and its commands;
- its shell, pages and nested features.

Supporting rules:

- Families do not import another family's implementation. Cross-family navigation imports only the
  destination's pure route/link interface.
- Shared `application`, authentication, shell, `routing` and domain-neutral UI modules stay narrow.
  Something is shared only once the generated semantics behind it are demonstrably common.
- Pages are thin route entries carrying one closed declarative **page policy**: `public`,
  `application`, or a named family and section. A page cannot configure its own layout,
  authentication, providers or fallbacks.
- Generated query keys, query options and hooks are the only cache identity for generated
  endpoints. Composition hooks derive views from independent generated queries rather than creating
  aggregate cache entries that could drift.

## Consequences

- A change to what a URL means has one owner, and one place to read to find out.
- Some duplication across families is expected and accepted. It is preferred to a premature shared
  abstraction, and is only collapsed once three families demonstrably say the same thing — as with
  the shared capability shape in `src/application/capability.ts`.
- Family error boundaries wrap family Suspense, and family fallbacks must render recognisable
  application chrome without invoking unresolved family hooks.
- Project rendering additionally waits for organisation adoption, which is a Projects-only concern
  and lives in the Projects family shell.
