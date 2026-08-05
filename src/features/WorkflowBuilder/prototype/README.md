# Workflow builder — UI prototype (THROWAWAY)

> Three variants of the workflow builder, switchable via `?variant=`, on the existing
> `/workflow-builder` route.

**Question being answered:** what should the workflow builder page look like? The plan
(`docs/workflow-builder-plan.md` §4) assumes a two-pane layout; this exists to check that against
genuinely different structures before committing.

## Run it

```
pnpm dev
```

Then open `/workflow-builder`. Cycle variants with the floating bar at the bottom, the `←` / `→`
arrow keys, or `?variant=A|B|C` directly. The bar is hidden when `NODE_ENV === "production"`.

| variant | name              | the bet                                                                               |
| ------- | ----------------- | ------------------------------------------------------------------------------------- |
| A       | Two-pane + drawer | One step in focus; workflow-level concerns live in a tabbed drawer. (The plan's pick) |
| B       | Vertical pipeline | No panels. The pipeline _is_ the UI, connections drawn between cards, expand in place |
| C       | Table + inspector | Authoring is spreadsheet-shaped; scanning "is everything wired?" is the main job      |

## What the stub workflow is doing

Five steps chosen to exercise every wiring shape in plan §1 at once:

1. `enumerate` — fed by a workflow input
2. `split` — emits a `type: files` output
3. `properties` — wired to `split`, so it **fans out** (runs once per chunk)
4. `combine` — a `type: files` input, so it **fans in** and waits for every replica
5. `score` — reaches back past three steps to `enumerate`, the case that stops the step list from
   doubling as the wiring diagram

Each variant answers the non-adjacent case differently — A in the source picker, B by splitting
"spine" connections from "inbound jumps", C by numbering the source in the bindings cell.

## What's real and what isn't

Real: the model shape, the derivation of workflow variables from `from-workflow` bindings, the
`inputs`/`outputs`/`options` sub-block inference, YAML emission, the unwirable-output warning (the
stub catalogue deliberately includes the broken shapes from
[squonk2-jobs#24](https://github.com/InformaticsMatters/squonk2-jobs/issues/24) — `chemaxon`'s
`results`, `rdkit`'s `outfile`, `silicos-it`'s compound `creates`), and the fan-out/fan-in rules
read out of the engine (`arityOf`, `deriveStepShapes`, and the adjacency check in `findIssues`).

**The input source pickers work.** Rebind one and watch the consequences propagate — fan-out
badges, the "must be combined" error, the derived variables, the YAML. Everything else is
read-only: nothing fetches, nothing saves, no other field is editable.

## When a variant wins

Fold it into real code under `src/features/WorkflowBuilder/`, rewritten properly. Then delete this
folder and the import in `src/pages/workflow-builder.tsx` from the branch, and keep the full set of
variants on a throwaway branch as the primary source.
