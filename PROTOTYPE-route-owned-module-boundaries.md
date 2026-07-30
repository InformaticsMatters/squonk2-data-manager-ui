# Route-Owned Module Boundaries Prototype

**Throwaway prototype.** This asks two reopened questions from “Define route-owned state and application module boundaries”:

1. Should the clean cutover use vertical route-family modules or retain horizontal features behind a shared scope layer?
2. Should a route resolve one immutable model for its shell and descendants, or should consumers independently invoke shared query hooks?

All variants implement the same fake project route, project-to-product ancestry resolution, capability derivation, loading behavior, and not-found behavior.

Run `pnpm dev`, then open:

```text
http://localhost:3000/prototype/route-architecture/alpha/files?variant=A
```

- **A: Vertical provider** — `verticalProvider/` owns the Project route contract, resolution boundary, capability derivation, and Files screen. Descendants consume one readonly route model.
- **B: Vertical hooks** — `verticalHooks/` keeps the Project family together, but consumers receive the route ID and independently invoke a composition hook. React Query deduplicates requests.
- **C: Shared scope** — `sharedScope/` retains horizontal feature placement behind an application-wide scope module. Adding route families expands its shared union and capability surface.
- **D: Suspense hooks** — `suspenseHooks/` uses the generated Data Manager and Account Server suspense hooks through an in-memory Axios adapter. The shell and Files screen independently call the same family hook while a family boundary owns loading, 404, and reset behavior.

Use the project links to compare editable, read-only, and missing-resource states. In D, use **Background refresh** to confirm that invalidation retains resolved content rather than returning to the Suspense fallback. Its request trace exposes the project-to-product waterfall and query deduplication. The rendered UI is deliberately plain; the source shape and dependency direction are the artifact under review.

## Suspense Findings

Suspense is practical for data that is required to render a route:

- The generated suspense hooks accept request/query options and retain their generated keys and invalidation helpers.
- Independent shell and Files consumers produce one request per key; React Query deduplicates them.
- The hook interface returns non-optional resources, removing loading/error branches from consumers.
- Initial Project-to-Product ancestry resolution is necessarily serial. Once cached, invalidating both resources refreshes concurrently without replacing content with the fallback.
- A route-family Suspense and query-error boundary is still required to own loading, reset, and 404-to-local-not-found behavior.
- The prototype route statically prerenders an empty client adapter and mounts queries after `router.isReady`; no authenticated request runs during SSR. Production should likewise mount required suspense reads only after authentication and API-client setup.

Suspense should not be universal. Generated suspense queries have no `enabled` option, so optional, user-triggered, and conditionally available reads should use ordinary queries or mount a separate child beneath its own Suspense boundary. In Next development mode a caught Axios 404 is also shown by the error overlay; the production build renders the local not-found state without an overlay, although React still reports the caught error to the console.

**Verdict:** combine B and D: vertical route-family composition hooks using generated suspense queries for required route resources, enclosed by family-owned Suspense/error boundaries. Use ordinary generated queries where absence or conditional execution is part of the interface.
