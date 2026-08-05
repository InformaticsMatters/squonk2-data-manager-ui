# Workflow Builder — implementation plan

Status: agreed design, not yet implemented.
Branch: `feat/workflow-builder`.
Target: `src/pages/workflow-builder.tsx` (stub exists), feature code under `src/features/WorkflowBuilder/`.

A page that lets a user compose Data Manager Jobs into a Workflow, wiring the output of one
Job into the input of the next, and save it through the Workflow API.

---

## 1. The definition language

Established against **workflow-engine `2.0.1`**
([squonk2-data-manager-workflow-engine](https://github.com/InformaticsMatters/squonk2-data-manager-workflow-engine)),
whose `workflow/workflow-schema.yaml` is the authoritative draft-07 JSON Schema.

```yaml
kind: DataManagerWorkflow
kind-version: "2025.2"
name: my-workflow # ^[a-z][a-z0-9-]{0,63}$ — RFC1035 label
description: ...
variables: {} # free-form; mirrors a Job's inputs/outputs/options JSON Schema
steps:
  - name: step-1 # same RFC1035 pattern, unique across the workflow
    description: ...
    specification: # collection + job + version are REQUIRED
      collection: my-jobs
      job: rdkit-molprops
      version: "1.0.0"
      variables: { outputFile: step1.out.smi } # flat map; string | integer | boolean only
    plumbing: # where every other variable comes from
      - { variable: inputFile, from-step: { name: step-0, variable: outputFile } }
      - { variable: name, from-workflow: { variable: rdkitPropertyName } }
      - { variable: inputDirPrefix, from-predefined: { variable: instance-link-glob } }
```

### Facts that shape the UI

**Execution order is the step array. Wiring is not.** `workflow_engine.py:381` advances with
`next_step = wf_response["steps"][step_index + 1]` — steps run one after another in written order,
and there is no dependency-driven scheduler. But `plumbing` wires _data_, not _order_, and it may
reach further back than the previous step: `_prepare_step` resolves prior-step connections through
`get_running_workflow_step_by_name` (`workflow_engine.py:653`), which finds **any** step that has
already run, and iterates a `{prior step name: connectors}` map, so one step may draw from several
earlier ones at once. Every referenced step's instance directory is hard-linked into the
consumer's (`dependent_instances`, `:788-797`), so the files stay reachable however far back the
producer was. Non-adjacent, many-to-one wiring is first class.

A step's input may therefore come from **any earlier step's output, or from a workflow input** —
not merely from step _n−1_. What is not supported is reaching _forwards_: a `from-step` naming a
later step, or the step itself, fails at run time on `assert prior_step`.

**Fan-out and fan-in are inferred from the Job definitions, not declared in the workflow.** There
is no parallelism syntax. The engine derives it entirely from the `type` of the two ports being
connected — the producing Job's `outputs.properties.<key>.type` and the consuming Job's
`inputs.properties.<variable>.type`:

| produces | consumes | what the engine does                                                         |
| -------- | -------- | ---------------------------------------------------------------------------- |
| `file`   | `file`   | one instance; value prefixed with the producer's instance directory          |
| `files`  | `file`   | **fan out** — consumer runs once per produced file                           |
| `file`   | `files`  | **fan in** — consumer is a combiner; waits for every replica of the producer |
| `files`  | `files`  | unusable — combiner semantics win, and the glob has nothing to iterate       |

- **Fan out** (`workflow_engine.py:710-777`). The consumer becomes a replica set. The engine reads
  the producer's _recorded_ output values, sets `replicas = len(values)`, and overwrites the wired
  variable per replica with `<producer-instance-dir>/<file>`. The replica count is a run-time fact
  — the builder cannot know or show it while authoring.
- **Fan in** (`:474-527`, `:668`, `:687`). A step is a combiner when one of its own inputs fed by a
  prior step has `type: files`. It blocks until every instance of that step is done, fails the
  workflow if any of them failed, and — importantly — the instance-directory prefix is deliberately
  **not** applied. The combining Job is expected to glob across the hard-linked replica directories
  instead, which is why the reference combiner also wires `inputDirPrefix` to the predefined
  `instance-link-glob`. **Only one prior step can be combined**: the engine takes the first `files`
  input it finds and breaks.

**A fan-out must be closed by a fan-in, immediately.** The driver launches "the next step" whenever
a step instance finishes, and has no notion of a replica set (`:373-390`). If `steps[i]` runs N
times and `steps[i+1]` is not a combiner over it, the engine attempts `steps[i+1]` once per
completing replica, each attempt resolving the wiring against replica 0 alone. The only safe shape
is splitter → replicated step → combiner, adjacent, in that order. Nothing upstream enforces this
— not the schema, not any validation level — so the builder has to. The engine's own split-combine
test is `@pytest.mark.skip`ped, so this path carries no upstream test coverage either; the
description above is read from the code.

**Validation is tiered.** CREATE = schema only; TAG adds unique step names; RUN adds "every
`from-workflow` variable has a value" and "every job exists in the DM". The validator docstring
states the DM **deliberately stores schema-invalid workflows** — it doubles as the persistent
store for in-progress editing. Save-as-draft is therefore a supported operation, not a hack.

**No JSON Schema defaults are applied.** `prime_variables` is seeded only from
`specification.variables` (`workflow_engine.py:~590`). If the Job command references a variable
the author never set, the step fails with `error_num=3`. The builder must make the author fill
in every command variable explicitly.

**The workflow-level `variables:` block is mandatory, and its sub-blocks are semantically
load-bearing** (`decoder.py:110-121`, `workflow_engine.py:615-621`):

| declared under | effect at run time                                    |
| -------------- | ----------------------------------------------------- |
| `inputs`       | file is **copied into** the step's instance directory |
| `outputs`      | file is **written back** to the project directory     |
| `options`      | neither — just a value                                |

Put a file variable under `options` by mistake and the file silently never arrives. Note the
counterintuitive consequence: a step output you want kept in the project is wired
**`from-workflow`**, not "to-workflow" — e.g. `{variable: outputFile, from-workflow: {variable:
clusteredMolecules}}` with `clusteredMolecules` declared under `variables.outputs`.

**Two distinct names.** The DM record `name` (multipart param, 2–80 chars, free text) and the
definition's `name` (RFC1035 label, lowercase). `workflow_get_response` exposes both as `name`
and `workflow_name`.

---

## 2. Scope of this iteration

**In scope:** the page itself — step list, job picker, per-step options form, cross-step wiring,
derived workflow variables, YAML emit/parse, save/patch, validation display.

**Out of scope:** navigation integration (page reachable by URL only). Running workflows is
already built (`WorkflowCard`, `WorkflowModal`, `RunWorkflowButton`, `RunningWorkflowsList`) and
is untouched.

**Explicitly deferred: the "advanced mode".** The original sketch called for a simple linear mode
plus a React Flow mode for free-form graphs. The deferral is narrower than it first looked: the
wiring _is_ a DAG over earlier steps (§1), and the simple mode has to support that, including
fan-out and fan-in. What the engine cannot do is **branched or cyclic execution** — no conditional
paths, no merges of independent branches, no loops — because the run order is fixed by the array.
A free-form DAG canvas would let users draw exactly those unrunnable shapes, so it waits.

> **Future work.** When the engine gains a DAG scheduler, add an advanced mode using React Flow
> (`@xyflow/react`, not currently a dependency) for branched and cyclic workflows. The typed
> model below should stay the source of truth so the two modes share one representation.

---

## 3. Blocking upstream work

### 3.1 The `from-step` resolution defect

How the engine resolves a cross-step connection (`workflow_engine.py:684-694`):

```python
assert connector.in_ in prior_step["variables"]                 # must be a variable of step A
value = prior_step["variables"][connector.in_]
if not we_are_a_combiner and connector.in_ in p_job_outputs:    # job's variables.outputs.properties
    value = f"{p_i_dir}/{value}"                                # prefix with A's instance dir
prime_variables[connector.out] = value
```

`from-step.variable` must be **both** a variable in step A's spec **and** a key in A's
`outputs.properties`. Otherwise the instance-directory prefix is silently skipped and step B
receives a bare filename it cannot find.

Survey of all 71 Jobs in 36 definition files across the submodules of `squonk2-jobs`:

| output declarations                                                           | count |
| ----------------------------------------------------------------------------- | ----- |
| property key **==** `creates` variable (chainable)                            | 23    |
| property key **!=** `creates` variable (e.g. `results:` / `{{ outputFile }}`) | 32    |
| `creates` is a literal or compound template (`'{{ outfilebase }}.sdf'`)       | 18    |
| no outputs block                                                              | 6     |

Only ~1/3 of declared Job outputs are safely chainable today. The chemaxon, cdk, fragmenstein and
smartcyp collections are entirely in the broken bucket — the value resolves but the path prefix
does not, giving a runtime file-not-found.

Tracked upstream as
[InformaticsMatters/squonk2-jobs#24](https://github.com/InformaticsMatters/squonk2-jobs/issues/24),
which carries the full per-Job breakdown.

**Agreed fix: both of the following.**

- **Engine resolves `creates`.** `from-step.variable` becomes the **outputs property key**; the
  engine renders that property's `creates` template against the prior step's resolved variables
  to get the real filename, then prefixes the instance directory. Repairs all 82 broken
  declarations without editing Job definitions, and handles compound templates. No
  workflow-schema change needed — `results` already matches the `variable-name` pattern. Tracked in
  [squonk2-data-manager-workflow-engine#42](https://github.com/InformaticsMatters/squonk2-data-manager-workflow-engine/issues/42).
- **Job definitions tidied** so the property key equals the `creates` variable — 32 mechanical
  renames, tracked in [squonk2-jobs#24](https://github.com/InformaticsMatters/squonk2-jobs/issues/24).
  The 18 compound-template declarations cannot be fixed by renaming and depend entirely on the
  engine change.

The UI is built now against this post-fix contract (see §5.3).

### 3.2 Other upstream items raised

- **Scope enum inconsistency.** `workflow_post_body.scope` accepts
  `GLOBAL | AS_ORGANISATION | AS_PROJECT` (`openapi/data-manager.yaml:4706`) but
  `workflow_get_response.scope` returns `GLOBAL | AS_ORGANISATION | AS_UNIT` (`:6297`). You can
  write a scope you cannot read back.
- **Stale example.** `tests/workflow-definitions/simple-python-parallel.yaml` in the engine repo
  uses `from: {step:, variable:}`, a key that does not exist in the schema. It would fail CREATE
  validation. The split-combine engine test is `@pytest.mark.skip`. Both raised under
  [workflow-engine#42](https://github.com/InformaticsMatters/squonk2-data-manager-workflow-engine/issues/42).

---

## 4. Page design

No app `Layout` — the stub already commits to full viewport.

```
┌────────────────────────────────────────────────────────────────────────┐
│ record name · definition name · scope · [Save] · validation status     │
├──────────────────┬──────────────────────────────┬──────────────────────┤
│ Steps            │ Selected step                │ Drawer               │
│                  │                              │                      │
│ 1. split      ⠿  │  Job:     [picker]  v1.0.0   │  ○ Workflow vars     │
│ 2. molprops ⇉ ⠿  │  Inputs:  [source picker]    │  ○ Validation        │
│ 3. combine  ⇶ ⠿  │  Options: [rjsf form]        │  ○ YAML (read-only)  │
│ [+ Add step]     │  Produces: [output ports]    │                      │
└──────────────────┴──────────────────────────────┴──────────────────────┘
```

- **Left** — ordered step list; add, reorder, delete. Order _is_ execution order. `⇉` marks a step
  that fans out (runs once per file), `⇶` a step that fans in (combines).
- **Centre** — detail for the selected step: job picker, one **source picker per input**, options
  form, and the step's output ports.
- **Right drawer** — toggles between the derived workflow variables review panel, validation
  errors, and the read-only YAML preview.

Because wiring can reach back arbitrarily far (§1), the left column cannot double as the wiring
diagram — position no longer implies connection. The source picker is where connections are made
and the only place they are authoritative; the list shows order and parallelism state.

---

## 5. Implementation

### 5.1 Typed model as source of truth

A typed TS model is authoritative; YAML is generated on save. Loading parses YAML into the model.

Anything unrepresentable — comments, anchors/aliases, key ordering, unknown keys under the
free-form `variables:` block — is lost on a round trip. Because the DM deliberately stores
hand-written and schema-invalid definitions, **the loader must detect a lossy round trip and
refuse to edit**, offering a read-only view instead of silently destroying someone's file.

Implementation note: parse with the `yaml` package (already a dependency), compare the re-emitted
document against the original, and gate editing on equivalence.

### 5.2 Routing and persistence

- Single page `/workflow-builder`. `?workflowId=` opens an existing workflow; absent means new.
- Explicit **Save**: `createWorkflow` (POST) on first save, `updateWorkflow` (PATCH) thereafter.
- Incomplete work saves fine — the DM tolerates schema-invalid definitions by design.
- Versioned workflows are immutable (PATCH rejected). Show a read-only banner.

### 5.3 Wiring

Connectable unit = the producing job's **outputs property key**, carrying its `title`,
`mime-types` and `type`.

Every step input gets a **source picker** — never a free-text field. The candidates for input _v_
of step _i_ are:

- every output of every step at index `< i`, filtered for compatibility — _not just step i−1_;
- every existing workflow input variable of a compatible type, plus a "new workflow input…" entry
  that creates one (§5.4 then derives its schema fragment);
- on a combiner, `instance-link-glob` for the `inputDirPrefix` affordance (§6).

Compatibility is two independent tests:

- **mime types** — the producer's `mime-types` must intersect the consuming input's. An empty list
  on either side means "undeclared"; offer it with a caveat rather than hiding it, since plenty of
  Job definitions omit the key.
- **arity** — the `file`/`files` table in §1. `files` → `file` is offered and labelled **fan out**;
  `file` → `files` is offered and labelled **fan in**; `files` → `files` is not offered.

Choosing a source that changes the workflow's shape must say so at the moment of choosing: picking
a fan-out source marks the step "runs once per file" and immediately raises the requirement that
the _next_ step be a combiner over it (§1). Parallelism is never edited directly — there is no
syntax for it — it is only ever a consequence of a wiring choice, so the UI reports it.

This assumption is isolated in **one module** so it is a small change if upstream lands
differently. Until the engine fix ships, saving a workflow containing cross-step wiring shows a
visible warning — workflows authored now will resolve paths incorrectly at run time.

### 5.4 Derived workflow variables

Any step variable that is neither set literally nor fed by a prior step is auto-promoted to a
workflow variable:

- **Sub-block** inferred from the consuming job's own declaration — a `file`/`files` input →
  `inputs`; a declared output → `outputs`; otherwise → `options`.
- **JSON Schema fragment** copied from the job (`title`, `type`, `mime-types`, `pattern`,
  `default`), so the existing `WorkflowModal` run form renders sensibly with no extra work.
- **Review panel** lists the derived variables so the author can rename them and resolve
  collisions (two steps both wanting `inputFile`).

> **Defect found by the UI prototype.** Matching the bound variable name against the job's
> `outputs.properties` **keys** misclassifies exactly the Jobs in the squonk2-jobs#24 mismatch
> class. Binding `outputFile` on a `chemaxon` step — whose output key is `results` — falls through
> to `options`, and per §1 an `options` file variable is never written back to the project. The
> rule needs a fallback: treat a variable as an output if it appears in **any** output's `creates`
> template, not only if it equals an output key. Both upstream fixes make the fallback redundant,
> but it is needed for as long as either is outstanding.

### 5.5 Job picker

- Grouped by `collection`+`job`, showing name, description, category.
- Version is a secondary control defaulting to the newest semver. `specification.version` is
  required by the schema — there is no "latest".
- Jobs with `disabled: true` are hidden from selection, but still render with a warning if an
  existing definition references one.
- `job_summary` (from `GET /job`) has **no `variables`** — each step needs its own `useGetJob`
  to know its ports. `/job/get-by-version` bridges the gap between the definition's
  `collection`+`job`+`version` addressing and `useGetJob`'s numeric `job_id`.

### 5.6 Validation

- Vendor the engine's draft-07 `workflow-schema.yaml` as JSON; validate with **ajv8** (already
  present via `@rjsf/validator-ajv8`) for instant CREATE-level feedback matching server semantics.
- Hand-write the TAG/RUN readiness checks: unique step names, unbound workflow variables,
  unwired required inputs.
- Hand-write the checks the engine needs but nothing upstream performs (§1), all of which the
  source picker prevents but a _loaded_ definition can still violate:
  - `from-step` naming a later step, or the step itself — error;
  - `from-step` naming a step that does not exist — error;
  - a step that fans out and is not followed immediately by a combiner over it — error;
  - a `files` → `files` connection — error;
  - a combiner drawing from more than one prior step, or two `files` inputs on one step — error,
    since the engine silently acts on only the first;
  - mime-type mismatch across a connection — warning, not error, since declarations are unreliable.
- Add a regeneration script and record which engine version the vendored schema came from
  (currently `2.0.1`, `kind-version: "2025.2"`).
- The server response (`validated`, `validation_error_num`, `validation_error_msg[]`) remains the
  final word and is surfaced in the drawer.

### 5.7 Testing

- Keep parse / emit / derive / validate in a dependency-free module.
- Test it in `tests/workflow-builder.node.ts` (the `node` Playwright project), using the engine
  repo's own example definitions as round-trip fixtures: `minimal.yaml`,
  `example-two-step-nop.yaml`, `simple-python-molprops-with-options.yaml`,
  `shortcut-example-1.yaml`. These are known-valid, so they double as drift detection against
  the real schema.
- Defer browser tests until the page settles.

---

## 6. Assumptions

Recorded so they can be challenged later.

- **Definition name** is auto-slugified from the record name to `^[a-z][a-z0-9-]{0,63}$`, and
  remains editable independently.
- **Scope** is hardcoded `GLOBAL` until the enum inconsistency (§3.2) is resolved. No scope
  selector yet.
- **`from-predefined`** is exposed only as the `inputDirPrefix` affordance on combiner steps —
  `instance-link-glob` is the only predefined variable that exists.
- **Fan-out / fan-in is derived, never configured.** The workflow language has no parallelism
  syntax (§1), so the builder shows the consequence of a wiring choice — "runs once per file",
  "waits for all replicas" — and enforces the adjacency rule, but offers no control to toggle it.
  The replica count is a run-time fact and is never shown while authoring.
