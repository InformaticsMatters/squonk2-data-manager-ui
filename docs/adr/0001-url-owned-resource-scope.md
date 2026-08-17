# 1. Resource scope belongs to the URL

Date: 2026-08-14

## Status

Accepted. Delivered by [#1914](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1914)
and its build tickets #1915–#1945.

## Context

Scope used to be mutable global state. A selected project, unit and organisation were persisted
outside the URL and could be restored or injected independently of the resource on screen. Route
changes copied unrelated query state, and some Results reads and capabilities were derived from the
selected project rather than from the project that actually owned the result.

The consequence was that the shell identity, the displayed data, the API requests, the available
actions, the browser history and a shared URL could all disagree with one another. In Results this
was a correctness bug, not just a navigation annoyance: a caller could be shown stale results, or
controls belonging to a different project ([#1277](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1277)).

## Decision

Every displayed resource and shareable view state is explicit in a canonical URL.

- Displayed resource IDs live in path segments. Mutable view state and workflow inputs live only in
  each family's explicit query allowlist.
- A route resolves and authorizes its parent before displaying descendants, and never silently
  switches scope to match a child or a persisted selection.
- The only domain context persisted between visits is the current organisation ID, resolved through
  its generated query. No organisation, unit, project, dataset or result object is held in mutable
  global selection state.
- Convenience entry routes canonicalise with replace-navigation: a project without a section enters
  Files, a dataset without a version resolves to its current version, Administration without a task
  enters Organisation & access.
- The cutover is clean. Removed routes produce an ordinary not-found; there are no redirects, query
  translations or compatibility aliases, and known legacy scope keys are cleared at bootstrap.

## Consequences

- A shared link reproduces what the sender saw, subject to authorization, and Back/Forward restore
  exactly the prior canonical state.
- Entering a project in another organisation must adopt that organisation before project content
  mounts, so identity and content cannot diverge.
- Pairing a valid child ID with the wrong parent is a section-local not-found. It never triggers
  owner discovery, redirect or scope adoption, which keeps parent scope authoritative and keeps
  resource existence private.
- Old bookmarks break. This was accepted deliberately: an inferred redirect would be a hidden
  compatibility behaviour of exactly the kind that made scope untrustworthy before.
