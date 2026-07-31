# URL-owned workspace traceability

This matrix records the production contracts introduced for issue
[#1915](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1915). Later vertical
workspace tickets extend this file with their screens, capabilities, commands, and lifecycle
evidence.

## Route And Link Contracts

| Contract ID | Family / section                 | Input or fixture                                                                                                                                 | Expected external outcome                                                                | Automated evidence                                                           |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ROUTE-P-01  | Projects index and workflows     | Every canonical Project index, creation, deletion, Files, Run, Results, and Manage href                                                          | Builders and parsers round trip without replacement                                      | `tests/contracts/projects-routes.node.ts` canonical href matrix              |
| ROUTE-P-02  | Projects entry                   | `/projects/[projectId]`                                                                                                                          | Replace target is that project's Files root                                              | `tests/contracts/projects-routes.node.ts` project entry case                 |
| ROUTE-P-03  | Projects static paths            | `/projects/new` and `/projects/deletions/[taskId]`                                                                                               | Static workflow routes are not interpreted as project IDs                                | `tests/contracts/projects-routes.node.ts` static precedence case             |
| ROUTE-P-04  | Project query ownership          | Index `search`; creation/deletion `subscription`; Files `path`; file view `path` and `viewer`; Run/Results `search` and repeated `type`          | Only section-owned values enter the parsed route model or canonical href                 | `tests/contracts/projects-routes.node.ts` allowlist and optional-state cases |
| ROUTE-P-05  | Project required identity        | Generated Project, Product, Task, Instance, Workflow, and Running Workflow ID formats; positive numeric Job IDs; generated Application ID format | Malformed required identity is not found and builders reject it                          | `tests/contracts/projects-routes.node.ts` malformed identity cases           |
| ROUTE-D-01  | Datasets routes                  | List, dataset resolution, explicit version, and version viewer hrefs                                                                             | Builders and parsers round trip without replacement                                      | `tests/contracts/datasets-routes.node.ts` canonical href matrix              |
| ROUTE-D-02  | Datasets query ownership         | `search`, `owner`, `editor`, `type`, and repeated `label`                                                                                        | List state survives route-driven detail/version/viewer links; unrelated keys are removed | `tests/contracts/datasets-routes.node.ts` list-state cases                   |
| ROUTE-D-03  | Dataset required identity        | Generated Dataset ID format and canonical positive safe-integer version                                                                          | Malformed IDs and versions are not found rather than corrected                           | `tests/contracts/datasets-routes.node.ts` malformed identity cases           |
| ROUTE-A-01  | Administration routes            | All four task landings and every approved typed resource collection                                                                              | Builders and parsers round trip without replacement                                      | `tests/contracts/administration-routes.node.ts` canonical href matrix        |
| ROUTE-A-02  | Administration entry             | `/administration`                                                                                                                                | Replace target is Organisation & access                                                  | `tests/contracts/administration-routes.node.ts` family entry case            |
| ROUTE-A-03  | Administration query ownership   | Any query string                                                                                                                                 | Canonical Administration links contain no query state                                    | `tests/contracts/administration-routes.node.ts` query-removal case           |
| ROUTE-A-04  | Administration required identity | Generated Organisation, Unit, and Product ID formats paired with their typed collections                                                         | Collection/identity mismatches are not found and builders reject them                    | `tests/contracts/administration-routes.node.ts` identity cases               |

## Composition And Runtime Contracts

| Contract ID | Area                | Input or fixture                                                                         | Expected external outcome                                                                                               | Automated evidence                                                                                           |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| COMP-01     | Page composition    | `public` policy                                                                          | Public shell and content only; public route entries attach the policy explicitly                                        | `tests/contracts/page-policy.node.ts`; production build                                                      |
| COMP-02     | Page composition    | `application` policy                                                                     | Authentication, API readiness, application shell, then content; protected route entries attach the policy explicitly    | `tests/contracts/page-policy.node.ts`; production build                                                      |
| COMP-03     | Family composition  | Every named Projects, Datasets, and Administration section                               | Authentication and API readiness precede the family error/Suspense boundaries and shells                                | `tests/contracts/page-policy.node.ts` family matrix                                                          |
| FAIL-01     | HTTP status         | Axios failures, native Fetch responses, and generated Fetch-shaped objects               | Confirmed `403`, `404`, `429`, and `5xx` receive distinct transport classifications                                     | `tests/contracts/transport-failure.node.ts` status matrix                                                    |
| FAIL-02     | Transient transport | Axios timeout, Fetch timeout, Axios network failure, and runtime-wrapped Fetch rejection | Timeout and network failures remain separately recoverable                                                              | `tests/contracts/transport-failure.node.ts` transient cases                                                  |
| FAIL-03     | Unknown transport   | Unsupported status, ordinary error, primitive, or malformed input                        | Unknown classification retains confirmed status when present and never parses messages                                  | `tests/contracts/transport-failure.node.ts` unknown cases                                                    |
| CACHE-01    | Generated endpoints | Future family composition using generated endpoint data                                  | Generated query options and key factories remain the sole endpoint cache identity; no family aggregate key is permitted | Architectural seam: route-family modules contain no query cache or aggregate fetch layer; strict review gate |

## Ownership Notes

- `src/projects/routes.ts`, `src/datasets/routes.ts`, and `src/administration/routes.ts` are the only
  family-owned route/link interfaces.
- `src/routing/` contains domain-neutral parsing and canonicalisation primitives only.
- `src/application/pagePolicy.ts` is the closed page-composition discriminant. It does not expose
  arbitrary layout, authentication, provider, or fallback flags.
- Every UI page entry attaches one policy with `withPagePolicy`; `_app` resolves it through
  `PagePolicyComposer` before rendering the page.
- `src/api/runtime/classifyTransportFailure.ts` classifies transport facts only. Route families retain
  ownership of non-disclosing parent failures, local child failures, stale-data behavior, and rendering.
- Route parsers operate on canonical relative hrefs before resource queries. Unknown query keys never
  appear in parsed route models and therefore cannot become generated query arguments.
