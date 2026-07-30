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

Use the project links to compare editable, read-only, and missing-resource states. The rendered UI is deliberately plain; the source shape and dependency direction are the artifact under review.
