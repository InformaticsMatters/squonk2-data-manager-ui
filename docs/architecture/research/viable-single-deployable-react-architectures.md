# Viable single-deployable React architectures

Research for [Research viable single-deployable React architectures](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1887), supporting the map [Ratify a scope-led architecture for the data manager UI](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1885).

**Date:** 2026-07-26

## Executive answer

The fixed constraint of one Node-capable deployable does not determine the React architecture. Five shapes are technically credible:

1. Next.js 16 App Router.
2. A deliberately rebuilt Next.js 16 Pages Router application.
3. React Router framework mode, represented by the requested v7 architecture while accounting for the fact that v8 superseded it in June 2026.
4. TanStack Start.
5. A Vite React SPA with a same-process Node BFF, preferably using a typed data router rather than a minimal declarative router.

The first three are viable without retiring a listed capability. TanStack Start is capability-complete but remains a maturity bet: its own overview still labels it Release Candidate, and its documented Vite-to-Node path currently uses the actively developed Nitro Vite plugin. The bespoke Vite/Node shape is viable by moving all sensitive and stream-oriented work into the BFF, but it deliberately assumes ownership that a full-stack framework otherwise supplies.

No option makes the existing application server-free. Better Auth's Keycloak secret, callback and cookie session handling; server-side access-token exchange; authenticated file retrieval; gzip decompression; SDF transformation; and the inline viewer proxy all require a trusted runtime. A static-only deployment is therefore not viable under preserved capabilities.

No winner is selected here. The later platform decision needs to choose which costs to own:

- App Router: a new server/client and caching model, with strong first-party integration and an incremental route-by-route path.
- Rebuilt Pages Router: the least platform migration and the most direct reuse of Node streams, but a conscious commitment to the older Next rendering model.
- React Router framework mode: explicit route/data boundaries and a conventional Node server, at the cost of replacing Next-specific integrations and owning MUI/Emotion SSR details.
- TanStack Start: the strongest alignment with typed routing, validated URL state and TanStack Query, with higher framework/deployment maturity risk.
- Vite SPA plus Node BFF: the clearest browser/server split and least rendering magic, with the highest amount of application-owned infrastructure and no framework SSR benefits unless those are built back in.

## Constraint interpretation

"One Node-capable deployable" is treated as one image/process boundary that can:

- serve HTML and static assets;
- expose the Better Auth callback and session endpoints;
- expose same-origin resource and proxy endpoints;
- perform Node stream and zlib work; and
- be configured under a non-root public path.

It does not require every request to pass through React, does not require React Server Components, and does not forbid direct browser calls to the account-server and data-manager APIs. The current event stream is also a direct browser WebSocket to a URL supplied by account-server, not a WebSocket upgraded by the UI server.

## Repository baseline

### Platform and deployment

- The app is Next.js 16 Pages Router on Node 24, React 19, MUI 9/Emotion, TanStack Query/Form/Table, Better Auth, and Orval-generated clients ([`package.json`](../../../package.json), [`AGENTS.md`](../../../AGENTS.md)).
- There are 53 files under `src/pages`, including 15 MDX pages. Seventy-four TypeScript files import Next or `nextjs-routes`, and 30 files call `useRouter`, so a non-Next migration is not a router-package swap.
- The build is already packaged as one Next standalone Node image. The Dockerfile copies `.next/standalone`, static assets and `public`, then runs `node server.js` ([`Dockerfile`](../../../Dockerfile)).
- `next.config.mjs` enables MDX, `nextjs-routes`, MUI-adjacent Emotion JSX, Sentry, standalone output configuration, and build-time `basePath` ([`next.config.mjs`](../../../next.config.mjs)).

### Authentication and API access

- Better Auth hosts `/api/auth/*`, uses Keycloak generic OAuth, requests `offline_access`, maps Keycloak claims/roles, and uses cookie-backed stateless sessions without an application database ([`src/lib/auth.ts`](../../../src/lib/auth.ts), [`src/pages/api/auth/[...all].ts`](../../../src/pages/api/auth/%5B...all%5D.ts)).
- Protected SSR obtains a session from incoming Node headers and starts the OAuth redirect while preserving the base-path-prefixed return URL ([`src/utils/next/withPageAuthRequiredSSR.ts`](../../../src/utils/next/withPageAuthRequiredSSR.ts)).
- In the browser, session state is used to obtain a Keycloak access token. That token is installed into both generated Axios clients behind a startup gate ([`src/hooks/useSetupApiClients.ts`](../../../src/hooks/useSetupApiClients.ts), [`src/pages/_app.tsx`](../../../src/pages/_app.tsx)).
- The generated packages expose Axios/TanStack Query modules, parallel `*/fetch` modules, and `*/zod` validators. The app currently uses the generated React Query/Axios surface extensively: 161 source files import one or both generated clients and 51 import TanStack Query. This is reusable React code, but the module chosen at a server boundary matters.

### Server-only and stream-oriented behavior

- The inline viewer endpoint gets a Better Auth access token, strips cookies before proxying, rewrites the path, streams the upstream response, and forces `content-disposition: inline` ([`src/utils/api/apiProxy.ts`](../../../src/utils/api/apiProxy.ts), [`src/pages/api/viewer-proxy/[...viewerProxy].ts`](../../../src/pages/api/viewer-proxy/%5B...viewerProxy%5D.ts)). `next-http-proxy-middleware` is Pages-API-specific and is not portable.
- Plain-text viewers authenticate server-side, fetch a project file or dataset version, optionally gunzip it, stop after 100,000 decompressed bytes, trim to a complete line, and SSR the bounded content ([`src/utils/api/plaintextViewerSSR.ts`](../../../src/utils/api/plaintextViewerSSR.ts), [`src/pages/project/file.tsx`](../../../src/pages/project/file.tsx), [`src/pages/dataset/[datasetId]/[datasetVersion].tsx`](../../../src/pages/dataset/%5BdatasetId%5D/%5BdatasetVersion%5D.tsx)).
- The SDF endpoint authenticates, fetches a possibly compressed file, pipes it through `node:zlib`, a decoder and `NodeSDFTransformer`, and streams JSON to the response ([`src/pages/api/sdf-parser.ts`](../../../src/pages/api/sdf-parser.ts)). The browser also uses Web Streams and the web SDF transformer to infer a schema ([`src/features/SDFViewer/useGetSDFSchema.ts`](../../../src/features/SDFViewer/useGetSDFSchema.ts)).
- The event stream is discovered/created through the generated account-server client and consumed directly in the browser with `react-use-websocket` ([`src/components/eventStream/EventStream.tsx`](../../../src/components/eventStream/EventStream.tsx)). All candidates can preserve this as a client-only service.

### Rendering, styling, routing and tests

- `_app` owns a single Query client, hydration, MUI/Emotion, theme, snackbar, MDX, top-level bootstrap hooks and the browser event stream. `_document` performs the MUI Pages Router Emotion extraction ([`src/pages/_app.tsx`](../../../src/pages/_app.tsx), [`src/pages/_document.tsx`](../../../src/pages/_document.tsx)). This provider tree is intrinsically client-heavy.
- MUI is pervasive (216 source files import `@mui/*`). Any SSR architecture must produce correct Emotion CSS on the first response, not merely make components compile.
- MDX currently receives MUI typography, the app's Next/MUI link adapter, and `next/image` through a global provider ([`src/context/MDXComponentProvider.tsx`](../../../src/context/MDXComponentProvider.tsx)). MDX portability therefore includes replacing Next components, not only adding a compiler plugin.
- `nextjs-routes` generates route/query and link types for the current file tree ([`types/nextjs-routes.d.ts`](../../../types/nextjs-routes.d.ts)). A target should preserve typed path params and should improve runtime validation of URL search state rather than treating compile-time route names as input validation.
- `basePath` is build-time Next configuration plus an application helper for auth, APIs and direct resource links. Dedicated node tests cover normalization, project links and OAuth return URLs ([`src/utils/app/basePath.ts`](../../../src/utils/app/basePath.ts), [`tests/base-path.node.ts`](../../../tests/base-path.node.ts)). Next itself prefixes framework links, but direct resource URLs and auth callback URLs still need explicit policy.
- Playwright has setup, unauthenticated browser, authenticated browser and node projects. The auth setup logs into real Keycloak and saves `storageState`; authenticated tests call real APIs ([`playwright.config.ts`](../../../playwright.config.ts), [`tests/login.setup.ts`](../../../tests/login.setup.ts), [`tests/project-bootstrap.browser-authenticated.ts`](../../../tests/project-bootstrap.browser-authenticated.ts)). Most behavior tests are portable, while startup commands, route assertions and node imports are not.

## Cross-cutting findings

### Keep three data paths distinct

Every candidate can use all three generated client surfaces, but they serve different boundaries:

1. **Interactive browser data:** retain generated Axios/TanStack Query hooks and the existing query invalidation behavior. This minimizes feature migration and preserves upload progress and Axios error behavior.
2. **Server rendering/loaders:** prefer generated fetch functions plus zod response validators, or deliberately construct a request-scoped Axios client. Do not mutate a process-global Axios authorization header with one user's token during SSR.
3. **Raw resources:** use framework/server handlers returning or piping a `Response`/Node stream. Do not serialize downloads, proxy bodies, or full SDF streams through page-loader/RSC payloads.

That separation is more consequential than the choice of router. It avoids credential leakage, duplicate caches and accidental buffering.

### Authentication is portable, callback geometry is not automatic

Better Auth has primary integration guides for Next.js App and Pages Router, React Router v7, TanStack Start and Express. The existing `auth` definition and browser client are therefore portable. Each architecture must nevertheless prove the following together:

- the externally registered Keycloak callback URL includes the deployment base path exactly once;
- the internal handler sees the path Better Auth expects (`/api/auth` after any mount-prefix stripping);
- OAuth `callbackURL` cannot escape the allowed origin/base path;
- `Set-Cookie` path, secure and same-site behavior survive the ingress;
- forwarded host/protocol are trusted correctly; and
- session and access-token calls work on document requests, client navigations and raw resource requests.

This should be an integration test against the actual ingress shape, not inferred from local root-path behavior.

### Base path is a system property

All credible routers have a UI basename/base-path concept, but none removes the need for a single application URL builder covering:

- framework navigation;
- plain anchors and `download` links;
- auth API and callback URLs;
- resource/proxy endpoints;
- static/MDX assets;
- route data/manifests; and
- test `baseURL` values.

Next's `basePath` and React Router's `basename` are build configuration. TanStack Router's `basepath` is router configuration. If one immutable image must be promoted under different public prefixes, every option needs either a runtime-generated public configuration/document or a rebuild; Next explicitly inlines `basePath` into client bundles at build time.

### Preserve streams as streams

Node 24 provides both Node and Web stream primitives. App Router Route Handlers, React Router resource routes and TanStack Start server routes all return Web `Response` objects and can stream. Existing Node transforms can be bridged or rewritten with Web streams. A custom Express server can retain Node piping directly.

The proof obligation is end-to-end behavior under the production adapter. Tests need to demonstrate backpressure, cancellation, gzip errors, the 100 KB decompressed cap, `content-disposition`, status/header propagation and no whole-body buffering. Framework API support alone does not prove that an ingress or deployment adapter preserves streaming.

## Option 1: Next.js 16 App Router

### Viability

Viable. It has first-party answers for all required capabilities and keeps the existing standalone Node deployment. The important qualification is that the current client-heavy feature code should initially enter App Router behind narrow Client Component boundaries; a migration that simultaneously rewrites routes, state, generated-client usage and all features into Server Components would multiply risk without being required.

### Natural target shape

- Resource-addressed route segments and nested layouts model organisation, unit, project and resource scopes.
- Server Components resolve authenticated route scope and fetch critical data using request-local fetch clients.
- A client `Providers` boundary owns MUI theme, Emotion, Query, forms, tables, Jotai, snackbars and the WebSocket stream.
- Existing interactive feature trees remain Client Components and continue using generated hooks; server rendering is adopted where it creates a clear boundary.
- Route Handlers host Better Auth, the viewer proxy and SDF/resource endpoints with `runtime = "nodejs"`.

### Requirement fit

| Area                        | Facts and trade-offs                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Better Auth/Keycloak        | Better Auth documents `toNextJsHandler`, RSC session reads and per-page/route validation for Next 16. The current handler changes from `toNodeHandler` to `toNextJsHandler`. Server Components cannot refresh cookies themselves, so cookie-setting operations belong in Route Handlers/Server Actions and may use Better Auth's `nextCookies` plugin.                     |
| Generated clients and Query | Existing hooks require Client Components and the Query provider. Generated fetch clients are suitable in Server Components/Route Handlers. Per-user server calls must use request-local headers and authenticated data should normally be uncached or explicitly user-keyed. Next's cache and Query's cache must not both own the same data accidentally.                  |
| MUI 9/Emotion               | MUI publishes `AppRouterCacheProvider` specifically to collect streamed MUI CSS and documents a Next 16 wrapper restriction when passing `next/link` as a MUI `component`. This is stronger first-party support than generic SSR options. The provider/theme still form a client boundary.                                                                                 |
| MDX                         | `@next/mdx` supports local MDX in `app` and Server Components. App Router additionally requires `mdx-components.tsx`. Existing MUI mappings, images and links must be adapted.                                                                                                                                                                                             |
| Viewer, SDF and proxy       | Node Route Handlers support streaming `Response` bodies. The current `next-http-proxy-middleware` handler must be replaced by a fetch/stream forwarding handler or temporarily remain in `pages/api` during migration. The bounded plaintext viewer can run in a Server Component or behind a resource route; full raw data must not cross the RSC serialization boundary. |
| Event stream                | Remains a Client Component. No server WebSocket support is required from Next because the browser connects to account-server's supplied location.                                                                                                                                                                                                                          |
| Routing and base path       | Nested layouts align well with scope-derived resource routes. Stable `typedRoutes` types `next/link`; generated `PageProps`/`RouteContext` type params. Search params still require runtime validation. `basePath` is supported but build-time and must still be applied to direct resource/auth URLs.                                                                     |
| SSR/client boundaries       | This is the largest conceptual change. Pages/layouts are Server Components by default; contexts, hooks, MUI interaction, browser streams and generated React Query hooks need Client Components. Props crossing the boundary must be serializable. The boundary can be introduced incrementally.                                                                           |
| Testing                     | Current Playwright production-server flows remain structurally valid. Add Route Handler tests and server/client boundary tests. Next's own guide recommends Playwright for E2E; unit tests of async server behavior are not a substitute for production adapter tests.                                                                                                     |
| Deployment                  | Existing `output: "standalone"` and Docker shape remain available. App and Pages routers can coexist, though transitions between them are hard navigations and cross-router prefetching does not occur.                                                                                                                                                                    |

### Migration and operational risk

- **Migration risk: medium-high.** Next dependencies remain useful, but every route and global provider must move to new conventions. Thirty `useRouter` callers and query-string-derived global scope are a material refactor.
- **Runtime risk: medium.** The Node deployment is familiar; cache semantics and server/client boundaries are the new failure modes.
- **Maturity: high.** App Router is the recommended Next architecture, Better Auth and MUI both document it directly, and Next provides an official incremental migration path.
- **Lock-in:** highest of the candidates because RSC, Route Handlers, cache directives, metadata and layouts are Next-specific.

### Decision cautions

- App Router should not be justified solely by RSC. Most current screens are highly interactive and will remain client code.
- Define authenticated caching rules before server-fetching generated API data. "Use fetch in a Server Component" is not a cache policy.
- Prototype the real proxy/SDF stream and MUI streamed CSS before treating API-level support as sufficient.

## Option 2: deliberately rebuilt Next.js 16 Pages Router

### Viability

Viable. This means a new scope-led route and module architecture built on Pages Router primitives, not retaining query-string scope, global synchronization hooks and current module boundaries because they already exist.

### Natural target shape

- Resource IDs move into path segments, with a central typed route builder and zod validation at route entry.
- A small page adapter resolves route/auth context and hands it to deep feature modules.
- TanStack Query remains the browser server-state owner; `getServerSideProps` is reserved for auth, bounded viewer content and genuinely first-response-critical data.
- API routes are consolidated around auth and raw resource/BFF concerns.
- Layout and provider ownership is explicit in `_app` or a `getLayout` convention rather than scattered page wrappers.

### Requirement fit

| Area                        | Facts and trade-offs                                                                                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Better Auth/Keycloak        | This is the current, documented Better Auth integration: `toNodeHandler` with body parsing disabled. Existing Node-header session and access-token code can be retained and simplified.                                                                                         |
| Generated clients and Query | Maximum reuse of current generated hooks, interceptors and Query invalidation. Server-side generated calls can continue with explicit Axios config or move to fetch/zod. Pages Router does not itself create a second framework data cache.                                     |
| MUI 9/Emotion               | MUI publishes and the app already uses the official Pages Router `_app`/`_document` integration. Lowest styling migration risk.                                                                                                                                                 |
| MDX                         | `@next/mdx` supports MDX pages in `pages`; current compilation/provider model remains valid while route organization and Next-specific component wrappers are cleaned up.                                                                                                       |
| Viewer, SDF and proxy       | Best direct fit for existing Node `IncomingMessage`/`ServerResponse`, zlib and piping. Pages API Routes explicitly support streaming, although Next documentation recommends incrementally adopting App Route Handlers on Next 14+.                                             |
| Event stream                | Unchanged browser component.                                                                                                                                                                                                                                                    |
| Routing and base path       | File routes can express resource paths, but nested layouts and inherited server route context are application conventions. `nextjs-routes` already types links and page query params. Search state still needs explicit schemas. Next's build-time `basePath` behavior remains. |
| SSR/client boundaries       | Familiar React SSR followed by hydration; no RSC module graph. This minimizes boundary errors but cannot reduce client JavaScript through Server Components. `getServerSideProps` serializes props and should not carry raw streams.                                            |
| Testing                     | Current Playwright and node-test harness needs the least change. Resource-route and auth tests can be strengthened without replacing the runner.                                                                                                                                |
| Deployment                  | Existing standalone image remains almost unchanged. This is the lowest deployment-complexity option.                                                                                                                                                                            |

### Migration and operational risk

- **Migration risk: medium.** Platform churn is low, but the requested scope-led architecture still requires route, state ownership and feature-boundary changes. Calling this "low risk" would understate the actual rebuild.
- **Runtime risk: low.** The app already proves the platform and deployment path.
- **Maturity: high but strategically older.** Next 16 continues to publish current Pages Router installation, SSR, API Route and Playwright documentation, while `create-next-app` marks App Router recommended. Pages API streaming documentation explicitly recommends App Route Handlers for Next 14+.
- **Lock-in:** moderate-high, though the React component/data layer remains conventional and easier to move than RSC code.

### Decision cautions

- A rebuilt Pages architecture needs an explicit rule preventing route/page files, global state and API details from becoming one shallow module again.
- Lack of nested route loaders/layouts means project-to-unit/organisation derivation must live in an application scope service, not ad hoc page effects.
- The decision would accept that future Next innovation and first-party examples focus on App Router. It should include a support-horizon assumption, not an unsupported claim that Pages Router is deprecated today.

## Option 3: React Router v7 framework mode

### Version fact

The architecture is viable, but a new implementation should not ignore version timing. React Router v7.18.0 was released on 2026-06-16 and v8.0.0 on 2026-06-17; v8.3.0 is current at this research date. The v7 upgrade guide says adopting its future flags makes the v8 change small. The requested v7 evaluation therefore describes the framework-mode model, while a later choice must explicitly decide whether to start on current v8 rather than pinning an already superseded major. Better Auth's integration guide is still titled React Router v7.

### Viability

Viable using SSR framework mode and one Node server. Route loaders/actions, nested layouts, middleware and resource routes provide the needed seams without RSC. An official Node Docker template exists, and an official custom Express template is available when proxy/server control is needed.

### Natural target shape

- Route modules and nested layouts represent resource scope; typed route params are delivered to loaders/components.
- Auth middleware validates the Better Auth session and puts identity in typed route context.
- Loaders resolve scope and prefill Query for critical data; existing generated hooks continue in route components.
- Resource routes host Better Auth and streaming/proxy endpoints.
- A custom Express server is optional, but attractive if direct Node stream proxying and operational middleware should remain outside router modules.

### Requirement fit

| Area                        | Facts and trade-offs                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Better Auth/Keycloak        | Better Auth documents a catch-all resource route whose loader/action returns `auth.handler(request)`. Server middleware/loaders can call `auth.api` with request headers. This is a direct Web Request integration.                                                                                                                                                        |
| Generated clients and Query | Server loaders are removed from client bundles and can use generated fetch/zod clients. `clientLoader` can preserve browser-only data paths. Existing Query hooks work normally, but choosing both loader revalidation and Query invalidation requires one ownership policy per datum.                                                                                     |
| MUI 9/Emotion               | MUI components are framework-neutral, but there is no MUI React Router streaming adapter equivalent to `@mui/material-nextjs`. MUI's generic SSR recipe requires a fresh Emotion cache per request, server collection and client rehydration. Integrating that with React Router's streaming `entry.server.tsx` is application-owned and needs a FOUC/hydration prototype. |
| MDX                         | Vite supports MDX through the official `@mdx-js/rollup` plugin. Existing MUI component mappings are reusable; `next/image` and Next links are not. There is no React Router file-route MDX convention to rely on, so docs routes/imports need explicit configuration.                                                                                                      |
| Viewer, SDF and proxy       | Resource routes return `Response` and are intended for images, PDFs, JSON and other non-UI content. Raw links use `<Link reloadDocument>` or anchors. Web-stream endpoints can forward/transform content; a custom Express server can preserve Node proxy middleware and zlib piping. Do not return file streams from UI loaders.                                          |
| Event stream                | Unchanged client component.                                                                                                                                                                                                                                                                                                                                                |
| Routing and base path       | Route configuration supports nested layouts, params and splats; framework typegen generates loader/action/component param types. `basename` is a framework config option. Type generation does not provide TanStack-style runtime-validated search schemas, so add zod schemas. Direct resource/auth/static URLs still need one base-aware builder.                        |
| SSR/client boundaries       | Conventional SSR and hydration, not RSC. Loaders are server-only and components are universal/client-hydrated. This is closer to the current mental model while providing deeper route context than Pages Router.                                                                                                                                                          |
| Testing                     | `createRoutesStub` supports isolated router-dependent components, but React Router warns it is not a good match for framework-generated route component types and recommends integration/E2E tests for route modules. The app's Playwright-heavy strategy therefore transfers well.                                                                                        |
| Deployment                  | Official Node Docker and custom Express Docker templates satisfy one deployable. Build output and static asset serving replace Next standalone tracing. A custom server adds package and patch ownership but gives explicit proxy control.                                                                                                                                 |

### Migration and operational risk

- **Migration risk: high.** Seventy-four Next-dependent files, Next image/link wrappers, Pages files, MDX routing, env naming, Sentry integration, build and Docker packaging all change. Most MUI/features and generated client hooks remain React code.
- **Runtime risk: medium.** The server model is conventional; MUI streamed SSR, base-path assets/data URLs and custom proxy behavior are proof points.
- **Maturity: high for the router/framework lineage.** It is the successor to Remix and has official Node deployment templates. Literal v7 is now a maintenance/version-choice risk because v8 is current.
- **Lock-in:** moderate. Route loaders/actions/resource routes are framework conventions, but use standard Request/Response and conventional React SSR.

### Decision cautions

- Decide explicitly whether route loaders or TanStack Query own revalidation. Running both defaults can duplicate requests and invalidate at surprising times.
- Prefer the custom Node template if the application wants first-class control over proxying, forwarded headers, health endpoints and stream lifecycle; use the stock server only if resource routes prove sufficient.
- Do not base the choice on React Router RSC APIs; v7/v8 release notes mark RSC framework work unstable.

## Option 4: TanStack Start

### Viability

Capability-complete and therefore genuinely credible, but conditionally viable for a production ratification until the team accepts its maturity and deployment-adapter risk. The official overview still says Release Candidate even though the npm package uses `1.x` versions.

### Natural target shape

- TanStack Router file routes encode resource scope and zod-validated search state.
- `beforeLoad`, loaders and request middleware derive authenticated scope and prefill a request-scoped Query client.
- Existing generated Query hooks consume the same cache in components.
- Start server routes host Better Auth and raw streaming/proxy handlers.
- The app remains conventional full-document SSR; experimental RSC is not needed.

### Requirement fit

| Area                        | Facts and trade-offs                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Better Auth/Keycloak        | Better Auth has a dedicated Start guide, a catch-all server route and `tanstackStartCookies`. It documents session checks via server functions and protected layout routes. The existing Keycloak plugin config remains usable.                                                                                               |
| Generated clients and Query | Strongest documented integration of the candidates: TanStack Router loaders can `ensureQueryData`, router dehydration can carry Query state, and Start supplies server/client execution boundaries. Generated fetch/zod clients suit server work; existing hooks suit components. Cache ownership still needs explicit rules. |
| MUI 9/Emotion               | No dedicated Start adapter was found. Generic MUI per-request Emotion SSR must be integrated with Start's full-document streaming and tested. This is a real integration task, not a package import.                                                                                                                          |
| MDX                         | Vite plus `@mdx-js/rollup` supplies compilation. Route/content conventions, MUI mappings, images and base-aware links are application-owned.                                                                                                                                                                                  |
| Viewer, SDF and proxy       | Start server routes receive Request/params/context and return Response, including splat routes. They can host Better Auth, proxying and Web streams. Node deployment can use Node APIs for zlib/SDF transforms. Adapter buffering and cancellation still require proof.                                                       |
| Event stream                | Unchanged client component.                                                                                                                                                                                                                                                                                                   |
| Routing and base path       | TanStack Router has end-to-end typed links/params, zod-compatible search validation and a `basepath` option. This aligns especially well with resource-addressed routes and explicit URL state. The server/static/auth side of a sub-path deployment still needs an end-to-end test.                                          |
| SSR/client boundaries       | Full-document SSR, streaming and server functions are stable Start concepts; RSC is documented as experimental and unnecessary. This avoids App Router's default RSC graph while providing explicit server-only functions.                                                                                                    |
| Testing                     | Router history/context can be instantiated for focused tests and Playwright can test the built Node app. The current real-auth E2E suite is portable after startup/URL changes. Framework-specific production testing has less accumulated project evidence than Next/React Router.                                           |
| Deployment                  | Start documents Node/Docker. Its Vite path currently says to use `nitro/vite`, which is under active development, then run `.output/server/index.mjs`. Rsbuild can expose a fetch-style server to `srvx` or Express. Both are one deployable, but introduce a new adapter layer and image recipe.                             |

### Migration and operational risk

- **Migration risk: high.** All Next integration changes plus adoption of a new full-stack framework. Existing TanStack knowledge and Query code reduce data-layer risk.
- **Runtime risk: medium-high.** Main concerns are MUI streaming integration, Nitro/hosting adapter maturity and framework RC status, not missing capabilities.
- **Maturity: lower than the other full-stack candidates by its own documentation.** TanStack Router and Query are mature; Start is not yet described as final.
- **Lock-in:** moderate. Typed route/search APIs and server functions are Start/TanStack-specific, while Request/Response and Query are portable.

### Decision cautions

- A later decision should require a pinned-version production spike, not rely on moving `latest` docs.
- Prove Node stream/zlib packaging, MUI first-response CSS, base path, Sentry and Better Auth callback behavior in the same image recipe.
- The close conceptual fit with TanStack Query is a benefit, not evidence that the full-stack runtime is as mature as Query.

## Option 5: Vite SPA plus same-process Node BFF

### Viability

Viable as a deliberately client-led architecture, provided the Node BFF remains part of the single deployable. A credible version uses Express or Fastify for auth/resources/static delivery and a typed data router (TanStack Router, or React Router data mode) for the browser. A bare component router plus ad hoc URL parsing would not meet the type-safe/resource-led goal.

### Natural target shape

- Vite emits browser assets and MDX.
- The Node server mounts Better Auth first, then authenticated proxy/viewer/SDF routes, static assets and the SPA fallback.
- TanStack Query and generated Axios hooks own interactive API state in the browser.
- A typed router owns resource paths and validated search state.
- Initial HTML is an application shell; authenticated scope is resolved after hydration unless a small runtime config/session bootstrap is embedded by the server.

### Requirement fit

| Area                        | Facts and trade-offs                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Better Auth/Keycloak        | Better Auth documents Express `toNodeHandler`, handler ordering and Node-header session lookup. Same-origin auth works naturally. Callback/base-path behavior remains an application/server mount concern.                                                                                                                                                    |
| Generated clients and Query | Maximum reuse of browser hooks and Axios setup. Fetch/zod clients remain available in BFF endpoints. There is no framework loader cache to conflict with Query unless a data router is deliberately used.                                                                                                                                                     |
| MUI 9/Emotion               | Client rendering is straightforward. Avoiding runtime SSR also avoids streamed Emotion extraction, at the cost of less useful initial HTML and possible style/content delay. If SSR is added, MUI's generic per-request extraction becomes application-owned.                                                                                                 |
| MDX                         | Official `@mdx-js/rollup` supports Vite. MUI mappings are reusable after replacing Next image/link components.                                                                                                                                                                                                                                                |
| Viewer, SDF and proxy       | Express/Fastify can preserve Node stream/zlib transforms and use standard proxy middleware. Plaintext viewer becomes a client fetch of a bounded authenticated BFF endpoint rather than page SSR. Raw direct URLs are normal BFF routes.                                                                                                                      |
| Event stream                | Unchanged client component.                                                                                                                                                                                                                                                                                                                                   |
| Routing and base path       | Both credible typed routers support a basename/basepath. The Node static fallback, Vite asset base, auth/resource mounts and direct URLs must share configuration. A runtime prefix is easier to own than Next's inlined build setting, but only if designed explicitly.                                                                                      |
| SSR/client boundaries       | Clearest split: React UI is browser code; secrets and transforms are server endpoints. There is no per-route SSR, server component or streamed HTML benefit. Vite describes its SSR API as low-level and intended for framework authors; adding bespoke SSR later means owning rendering, data serialization, errors, asset manifests and Emotion extraction. |
| Testing                     | Browser behavior maps well to Playwright. BFF endpoints can be tested as normal Node HTTP handlers. Authenticated initial-render behavior changes and needs explicit loading/error tests.                                                                                                                                                                     |
| Deployment                  | One ordinary Node image serves assets and endpoints. There is no Next standalone tracing, but dependency packaging, cache headers, compression, graceful shutdown and health checks are application responsibilities.                                                                                                                                         |

### Migration and operational risk

- **Migration risk: high.** Next routing/components/build/deployment are replaced, though most interactive feature code stays client-side and avoids RSC adaptation.
- **Runtime risk: medium.** The runtime pieces are individually mature and explicit; integration and security correctness belong entirely to this repository.
- **Maturity: high for React, Vite, Node servers and routers individually; no single framework contract covers the composition.** Vite explicitly describes its SSR API as low-level for framework authors.
- **Lock-in:** low at framework level, high to the application's own BFF conventions.

### Decision cautions

- This option is credible only if loss of per-route SSR is acceptable. "We can add Vite SSR later" is effectively a commitment to build a framework and should not be treated as free optionality.
- Keep the Node BFF narrow. Reimplementing upstream business APIs in it would create a second backend, not merely satisfy UI runtime needs.
- A visible authenticated bootstrap state is required; the app must not briefly render unauthorized scope or initiate generated API calls before token readiness.

## Comparative decision matrix

This matrix establishes relative facts; it is intentionally not a weighted score.

| Dimension                        | Next App Router                                    | Rebuilt Next Pages                                 | React Router framework                                 | TanStack Start                                  | Vite SPA + Node BFF                         |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------- |
| Preserve all listed capabilities | Yes                                                | Yes                                                | Yes                                                    | Yes, subject to adapter proof                   | Yes, with client-led rendering              |
| One Node deployable              | Existing standalone pattern                        | Existing standalone pattern                        | Official Node/custom Express Docker patterns           | Documented Node path via Nitro or fetch server  | Custom ordinary Node image                  |
| Existing UI reuse                | High after Client boundaries                       | Highest                                            | Medium-high                                            | Medium-high                                     | High                                        |
| Existing server code reuse       | Medium; Request/Response stream adaptation         | Highest                                            | Medium-high with custom Node server                    | Medium                                          | Highest in custom Node routes               |
| Scope-led nested routing         | First-class nested layouts                         | Convention/application service                     | First-class route nesting/context                      | First-class typed route context                 | Router-dependent                            |
| Typed params/links               | Stable Next typed routes; runtime schemas separate | Existing `nextjs-routes`; runtime schemas separate | Generated route module types; runtime schemas separate | Strong route, param and validated search typing | Strong if TanStack Router; otherwise manual |
| Query integration                | Supported, but coordinate with Next cache          | Straightforward single client cache                | Coordinate loader revalidation with Query              | First-class documented coordination             | Straightforward browser Query ownership     |
| MUI/Emotion SSR                  | Dedicated streaming adapter                        | Dedicated proven adapter                           | Generic integration owned here                         | Generic integration owned here                  | Not needed without SSR                      |
| MDX                              | First-party Next integration                       | Existing first-party integration                   | Vite MDX plugin plus route convention                  | Vite MDX plugin plus route convention           | Vite MDX plugin                             |
| Raw streaming resources          | Route Handlers/Web streams                         | API Routes/Node streams                            | Resource routes or custom Node server                  | Server routes/Web streams                       | Custom Node routes                          |
| Rendering model                  | RSC plus Client Components                         | Conventional SSR/CSR                               | Conventional streamed SSR/CSR                          | Full-document streamed SSR/CSR                  | CSR shell by default                        |
| Framework maturity               | High/current recommendation                        | High/older model                                   | High lineage; v7 superseded by v8                      | Start docs still say RC                         | Mature parts, bespoke composition           |
| Platform migration risk          | Medium-high                                        | Medium                                             | High                                                   | High                                            | High                                        |
| Deployment change                | Low                                                | Lowest                                             | Medium                                                 | Medium-high                                     | Medium-high                                 |
| Application-owned infrastructure | Low-medium                                         | Low                                                | Medium                                                 | Medium                                          | High                                        |

## Required proof before platform selection

A short, production-shaped spike for any finalist should use the same acceptance set so the HITL decision compares evidence rather than demos:

1. Build one resource-addressed authenticated project route. Derive unit and organisation server-side or at the route boundary, with no global selection prerequisite.
2. Complete Keycloak login and callback under a non-empty base path through the expected reverse proxy. Verify session refresh, logout and return-to behavior.
3. Call one generated API through each intended path: browser Axios/Query, server fetch with zod validation, and an unauthenticated public call.
4. Stream a large `.gz` project file through the viewer path, cap by decompressed bytes, cancel early and verify process memory does not scale with file size.
5. Stream SDF records through the Node transformer and verify malformed gzip/SDF errors after headers have and have not been sent.
6. Proxy a direct viewer URL while preserving status/content type and forcing inline disposition. Test `GET`, range behavior if required, cancellation and base path.
7. Render a MUI page and MDX page on a cold direct request. Assert no FOUC, hydration error or incorrect asset/link prefix.
8. Connect the browser event stream after auth and verify route navigation does not create duplicate sockets.
9. Build and run the final one-image artifact with the same Node version, ingress headers and health/startup contract expected in production.
10. Run Playwright against the production build, including direct deep links, refreshes, new-tab resource links and authenticated storage state.

## Options not carried forward

- **Static-only React SPA:** cannot securely host Better Auth's client secret/access-token exchange or preserve authenticated proxy/decompression/SDF server capabilities.
- **Astro with React islands:** technically Node-deployable, but the application is an interactive authenticated React shell rather than content-first islands. It would add a second component/runtime model without removing the need for React routing, Query and the Node BFF.
- **React Router/TanStack experimental RSC modes:** not needed for the requirements and explicitly described as unstable/experimental. They should not be the foundation of this decision.
- **Micro-frontends:** can be packaged into one image but do not answer the platform/runtime question and would increase routing, auth, shared-state and deployment complexity.

## Primary sources

### Next.js and MUI

- [Next.js: migrate from Pages to App Router](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js: Route Handlers, including streaming and Node runtime](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js: `basePath`](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath)
- [Next.js: standalone output/file tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Next.js: stable typed routes](https://nextjs.org/docs/app/api-reference/config/next-config-js/typedRoutes)
- [Next.js: MDX](https://nextjs.org/docs/app/guides/mdx)
- [Next.js: Pages Router installation](https://nextjs.org/docs/pages/getting-started/installation)
- [Next.js: Pages API Routes and streaming](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Next.js: Pages SSR](https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering)
- [Next.js: App Router Playwright](https://nextjs.org/docs/app/guides/testing/playwright)
- [Next.js: Pages Router Playwright](https://nextjs.org/docs/pages/guides/testing/playwright)
- [MUI: Next.js App and Pages Router integrations](https://mui.com/material-ui/integrations/nextjs/)
- [MUI: generic server rendering with Emotion](https://mui.com/material-ui/guides/server-rendering/)

### Authentication

- [Better Auth: Next.js integration](https://www.better-auth.com/docs/integrations/next)
- [Better Auth: React Router v7 integration](https://www.better-auth.com/docs/integrations/react-router)
- [Better Auth: TanStack Start integration](https://www.better-auth.com/docs/integrations/tanstack)
- [Better Auth: Express integration](https://www.better-auth.com/docs/integrations/express)

### React Router

- [React Router framework rendering strategies](https://reactrouter.com/start/framework/rendering)
- [React Router route modules](https://reactrouter.com/start/framework/route-module)
- [React Router resource routes](https://reactrouter.com/how-to/resource-routes)
- [React Router framework config, including basename](https://reactrouter.com/api/framework-conventions/react-router.config.ts)
- [React Router Node streamed server entry](https://reactrouter.com/api/framework-conventions/entry.server.tsx)
- [React Router type safety](https://reactrouter.com/explanation/type-safety)
- [React Router deployment templates](https://reactrouter.com/start/framework/deploying)
- [React Router testing guidance](https://reactrouter.com/start/framework/testing)
- [React Router v7 to v8 upgrade](https://reactrouter.com/upgrading/v7)
- [React Router release history](https://reactrouter.com/changelog)

### TanStack and Vite/MDX

- [TanStack Start overview and RC status](https://tanstack.com/start/latest/docs/framework/react/overview)
- [TanStack Start Node/Docker hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [TanStack Start server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)
- [TanStack Start middleware](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)
- [TanStack Router external data/Query integration](https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading)
- [TanStack Router type safety](https://tanstack.com/router/latest/docs/framework/react/guide/type-safety)
- [TanStack Router validated search params](https://tanstack.com/router/latest/docs/framework/react/guide/search-params)
- [TanStack Router options, including basepath](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType)
- [Vite low-level SSR guide](https://vite.dev/guide/ssr)
- [MDX Rollup/Vite plugin](https://mdxjs.com/packages/rollup/)
