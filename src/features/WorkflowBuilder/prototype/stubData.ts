/**
 * PROTOTYPE — THROWAWAY CODE. Do not build on this.
 *
 * Stub model + catalogue for the workflow-builder UI prototype. Shapes mirror
 * `docs/workflow-builder-plan.md` closely enough to make the variants honest, but nothing here is
 * production-bound: no API calls, no persistence, no validation beyond what makes the screens
 * legible.
 *
 * The Jobs below are real ones lifted from `squonk2-jobs` and the engine's own unit-test Job
 * definitions, deliberately including the broken output shapes catalogued in squonk2-jobs#24 so
 * the variants have to show that state.
 *
 * Wiring follows plan §1: a step input may be fed by *any* earlier step's output or by a workflow
 * input, and fan-out / fan-in fall out of the `file` vs `files` types of the connected ports.
 */

import { stringify } from "yaml";

export type Arity = "fan-in" | "fan-out" | "one-to-one";

export interface JobOutput {
  key: string;
  title: string;
  mimeTypes: string[];
  /** The raw `creates` template from the Job definition. */
  creates: string;
  /** `files` means the Job emits an unknown number of files — the fan-out source. */
  type: "file" | "files";
}

export interface JobInput {
  name: string;
  title: string;
  mimeTypes: string[];
  /** `files` means the Job consumes a replica set — the fan-in sink. */
  type: "file" | "files";
  required: boolean;
}

export interface JobOption {
  name: string;
  title: string;
  type: "boolean" | "integer" | "string";
  default?: boolean | number | string;
  required: boolean;
}

export interface JobDef {
  collection: string;
  job: string;
  version: string;
  name: string;
  description: string;
  category: string;
  inputs: JobInput[];
  outputs: JobOutput[];
  options: JobOption[];
}

export type Binding =
  | { variable: string; kind: "from-predefined"; predefined: string }
  | { variable: string; kind: "from-step"; stepName: string; outputKey: string }
  | { variable: string; kind: "from-workflow"; workflowVariable: string };

export interface Step {
  name: string;
  description: string;
  collection: string;
  job: string;
  version: string;
  variables: Record<string, boolean | number | string>;
  plumbing: Binding[];
}

export interface WorkflowModel {
  recordName: string;
  definitionName: string;
  description: string;
  scope: "AS_ORGANISATION" | "AS_PROJECT" | "GLOBAL";
  steps: Step[];
}

// --- catalogue -------------------------------------------------------------------------------

export const JOB_CATALOGUE: JobDef[] = [
  {
    collection: "im-virtual-screening",
    job: "enumerate-candidates",
    version: "1.0.0",
    name: "Enumerate candidates",
    description: "Enumerate undefined stereoisomers, tautomers and charge states",
    category: "ligand preparation",
    inputs: [
      {
        name: "inputFile",
        title: "Input molecules",
        mimeTypes: ["chemical/x-mdl-sdfile", "squonk/x-smiles"],
        type: "file",
        required: true,
      },
    ],
    // key !== creates variable — the squonk2-jobs#24 "mismatch" class
    outputs: [
      {
        key: "enumerated",
        title: "Enumerated molecules",
        mimeTypes: ["squonk/x-smiles"],
        creates: "{{ outputFile }}",
        type: "file",
      },
    ],
    options: [
      { name: "outputFile", title: "Output file", type: "string", required: true },
      { name: "enumerateCharges", title: "Enumerate charges", type: "boolean", required: false },
      { name: "tryEmbedding", title: "Try embedding", type: "boolean", required: false },
    ],
  },
  {
    // The engine's own splitter fixture. `type: files` on the output is what makes the *next*
    // step fan out — see tests/job-definitions/job-definitions.yaml in the engine repo.
    collection: "workflow-engine-unit-test-jobs",
    job: "splitsmiles",
    version: "1.0.0",
    name: "Split molecules",
    description: "Split an input file into chunks for parallel processing",
    category: "utilities",
    inputs: [
      {
        name: "inputFile",
        title: "Input molecules",
        mimeTypes: ["squonk/x-smiles"],
        type: "file",
        required: true,
      },
    ],
    outputs: [
      {
        key: "outputBase",
        title: "Chunks",
        mimeTypes: ["squonk/x-smiles"],
        creates: "{{ outputBase }}_*.smi",
        type: "files",
      },
    ],
    options: [{ name: "outputBase", title: "Chunk base name", type: "string", required: true }],
  },
  {
    collection: "rdkit",
    job: "generate-low-energy-conformers",
    version: "1.0.0",
    name: "Generate low energy conformers",
    description: "Generate conformers and minimise with RDKit",
    category: "conformer generation",
    inputs: [
      {
        name: "inputFile",
        title: "Input molecules",
        mimeTypes: ["squonk/x-smiles", "chemical/x-mdl-sdfile"],
        type: "file",
        required: true,
      },
    ],
    // key !== creates variable — mismatch, in the opposite direction
    outputs: [
      {
        key: "outfile",
        title: "Conformers",
        mimeTypes: ["chemical/x-mdl-sdfile"],
        creates: "{{ outputFile }}",
        type: "file",
      },
    ],
    options: [
      { name: "outputFile", title: "Output file", type: "string", required: true },
      {
        name: "numConformers",
        title: "Number of conformers",
        type: "integer",
        default: 10,
        required: false,
      },
    ],
  },
  {
    collection: "chemaxon",
    job: "chemaxon-molecular-props-simple",
    version: "1.0.0",
    name: "ChemAxon molecular properties",
    description: "Calculate a standard set of molecular properties",
    category: "molecular properties",
    inputs: [
      {
        name: "inputFile",
        title: "Input molecules",
        mimeTypes: ["chemical/x-mdl-sdfile", "squonk/x-smiles"],
        type: "file",
        required: true,
      },
    ],
    // key !== creates variable — the whole chemaxon collection is like this
    outputs: [
      {
        key: "results",
        title: "Output file",
        mimeTypes: ["chemical/x-mdl-sdfile"],
        creates: "{{ outputFile }}",
        type: "file",
      },
    ],
    options: [{ name: "outputFile", title: "Output file", type: "string", required: true }],
  },
  {
    collection: "workflow-engine-unit-test-jobs",
    job: "rdkit-molprops",
    version: "1.0.0",
    name: "RDKit molecular properties",
    description: "Add a calculated column to the input",
    category: "molecular properties",
    inputs: [
      {
        name: "inputFile",
        title: "Input molecules",
        mimeTypes: ["squonk/x-smiles"],
        type: "file",
        required: true,
      },
    ],
    // key === creates variable — the shape that actually works today
    outputs: [
      {
        key: "outputFile",
        title: "Output file",
        mimeTypes: ["squonk/x-smiles"],
        creates: "{{ outputFile }}",
        type: "file",
      },
    ],
    options: [
      { name: "outputFile", title: "Output file", type: "string", required: true },
      { name: "name", title: "Property name", type: "string", required: true },
      { name: "value", title: "Property value", type: "string", required: false },
    ],
  },
  {
    collection: "silicos-it",
    job: "shape-it-search",
    version: "1.0.0",
    name: "Shape-it search",
    description: "Align molecules by shape against a reference",
    category: "shape alignment",
    inputs: [
      {
        name: "inputFile",
        title: "Input molecules",
        mimeTypes: ["chemical/x-mdl-sdfile"],
        type: "file",
        required: true,
      },
    ],
    // compound `creates` — cannot be wired at all until the engine renders templates
    outputs: [
      {
        key: "alignments",
        title: "Alignments",
        mimeTypes: ["chemical/x-mdl-sdfile"],
        creates: "{{ outfilebase }}.sdf",
        type: "file",
      },
      {
        key: "scores",
        title: "Scores",
        mimeTypes: ["text/tab-separated-values"],
        creates: "{{ outfilebase }}.tab",
        type: "file",
      },
    ],
    options: [{ name: "outfilebase", title: "Output base name", type: "string", required: true }],
  },
  {
    // The engine's own combiner fixture: a `files` input is the only thing that marks a step as a
    // combiner, and `inputDirPrefix` exists because the engine skips the instance-dir prefix and
    // expects the Job to glob across replica directories instead.
    collection: "workflow-engine-unit-test-jobs",
    job: "concatenate",
    version: "1.0.0",
    name: "Concatenate files",
    description: "Combine the files produced by a parallel step into one",
    category: "utilities",
    inputs: [
      {
        name: "inputFile",
        title: "Input files",
        mimeTypes: ["squonk/x-smiles"],
        type: "files",
        required: true,
      },
    ],
    outputs: [
      {
        key: "outputFile",
        title: "Combined file",
        mimeTypes: ["squonk/x-smiles"],
        creates: "{{ outputFile }}",
        type: "file",
      },
    ],
    options: [
      { name: "outputFile", title: "Output file", type: "string", required: true },
      { name: "inputDirPrefix", title: "Input directory prefix", type: "string", required: false },
    ],
  },
];

export const findJob = (step: Pick<Step, "collection" | "job" | "version">) =>
  JOB_CATALOGUE.find(
    (j) => j.collection === step.collection && j.job === step.job && j.version === step.version,
  );

// --- initial state ---------------------------------------------------------------------------

/**
 * Deliberately exercises every wiring shape the plan calls for: a straight connection, a fan-out
 * closed by a fan-in, and a step reaching back past its predecessor to step 1.
 */
export const INITIAL_WORKFLOW: WorkflowModel = {
  recordName: "Parallel property pipeline",
  definitionName: "parallel-property-pipeline",
  description: "Enumerate, split, calculate properties in parallel, recombine, then score",
  scope: "GLOBAL",
  steps: [
    {
      name: "enumerate",
      description: "Enumerate candidate molecules",
      collection: "im-virtual-screening",
      job: "enumerate-candidates",
      version: "1.0.0",
      variables: { outputFile: "enumerated.smi", enumerateCharges: true },
      plumbing: [
        { variable: "inputFile", kind: "from-workflow", workflowVariable: "candidateMolecules" },
      ],
    },
    {
      name: "split",
      description: "Split into chunks for parallel processing",
      collection: "workflow-engine-unit-test-jobs",
      job: "splitsmiles",
      version: "1.0.0",
      variables: { outputBase: "chunk" },
      plumbing: [
        {
          variable: "inputFile",
          kind: "from-step",
          stepName: "enumerate",
          outputKey: "enumerated",
        },
      ],
    },
    {
      name: "properties",
      description: "Calculate properties on one chunk",
      collection: "workflow-engine-unit-test-jobs",
      job: "rdkit-molprops",
      version: "1.0.0",
      variables: { outputFile: "props.smi", name: "logp" },
      // `split.outputBase` is `type: files` and this input is `type: file` — this step fans out.
      plumbing: [
        { variable: "inputFile", kind: "from-step", stepName: "split", outputKey: "outputBase" },
      ],
    },
    {
      name: "combine",
      description: "Recombine the parallel chunks",
      collection: "workflow-engine-unit-test-jobs",
      job: "concatenate",
      version: "1.0.0",
      variables: { outputFile: "combined.smi" },
      // This input is `type: files` — the step is a combiner and waits for every replica above.
      plumbing: [
        {
          variable: "inputFile",
          kind: "from-step",
          stepName: "properties",
          outputKey: "outputFile",
        },
        { variable: "inputDirPrefix", kind: "from-predefined", predefined: "instance-link-glob" },
      ],
    },
    {
      name: "score",
      description: "Score the original enumerated set",
      collection: "chemaxon",
      job: "chemaxon-molecular-props-simple",
      version: "1.0.0",
      variables: {},
      // Reaches back past three steps to step 1 — legal, and the reason the step list cannot
      // double as the wiring diagram.
      plumbing: [
        {
          variable: "inputFile",
          kind: "from-step",
          stepName: "enumerate",
          outputKey: "enumerated",
        },
        { variable: "outputFile", kind: "from-workflow", workflowVariable: "scoredMolecules" },
      ],
    },
  ],
};

// --- derived state ---------------------------------------------------------------------------

/**
 * A single-file output is wirable today only when its property key equals the variable named in
 * `creates` — otherwise the engine skips the instance-directory prefix. See squonk2-jobs#24 /
 * workflow-engine#42.
 *
 * `files` outputs are exempt: the engine takes those values from the recorded step outputs and
 * prefixes them itself when it launches each replica, so the template never has to be resolved.
 */
const BARE_TEMPLATE = /^\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}$/u;

export const isOutputWirable = (output: JobOutput) => {
  if (output.type === "files") {
    return true;
  }
  const match = BARE_TEMPLATE.exec(output.creates.trim());
  return match !== null && match[1] === output.key;
};

/** `files` → `files` has no meaning to the engine, so it is not a connection at all. */
export const arityOf = (output: JobOutput, input: JobInput): Arity | null => {
  if (output.type === "files") {
    return input.type === "file" ? "fan-out" : null;
  }
  return input.type === "files" ? "fan-in" : "one-to-one";
};

export const ARITY_LABEL: Record<Arity, string> = {
  "fan-in": "fan in — waits for every replica",
  "fan-out": "fan out — runs once per file",
  "one-to-one": "one to one",
};

const mimesIntersect = (a: string[], b: string[]) =>
  a.length === 0 || b.length === 0 || a.some((mime) => b.includes(mime));

// --- parallelism -----------------------------------------------------------------------------

export interface StepShape {
  /** This step runs once per file produced by an earlier step. */
  replicated: boolean;
  /** This step waits for, and combines, every replica of `combines`. */
  combiner: boolean;
  /** Name of the step being combined, when `combiner`. */
  combines?: string;
  /** This step emits a `files` output that something downstream fans out over. */
  splits: boolean;
}

/**
 * Mirrors `_prepare_step`: combiner-ness is decided by *our* input type, replication by the
 * *producer's* output type, and combiner-ness wins.
 */
export const deriveStepShapes = (model: WorkflowModel): Map<string, StepShape> => {
  const shapes = new Map<string, StepShape>();

  for (const step of model.steps) {
    const jobDef = findJob(step);
    let combines: string | undefined;
    let replicated = false;

    for (const binding of step.plumbing) {
      if (binding.kind !== "from-step") {
        continue;
      }
      const input = jobDef?.inputs.find((i) => i.name === binding.variable);
      if (input?.type === "files") {
        combines ??= binding.stepName;
        continue;
      }
      const source = model.steps.find((s) => s.name === binding.stepName);
      const output = source && findJob(source)?.outputs.find((o) => o.key === binding.outputKey);
      if (output?.type === "files") {
        replicated = true;
      }
    }

    shapes.set(step.name, {
      combiner: combines !== undefined,
      combines,
      replicated: combines === undefined && replicated,
      splits: false,
    });
  }

  // A step "splits" only if something downstream actually fans out over its `files` output.
  for (const step of model.steps) {
    for (const binding of step.plumbing) {
      if (binding.kind !== "from-step" || shapes.get(step.name)?.combiner) {
        continue;
      }
      const source = model.steps.find((s) => s.name === binding.stepName);
      const output = source && findJob(source)?.outputs.find((o) => o.key === binding.outputKey);
      const shape = source && shapes.get(source.name);
      if (output?.type === "files" && shape) {
        shape.splits = true;
      }
    }
  }

  return shapes;
};

// --- workflow variables ----------------------------------------------------------------------

export interface DerivedVariable {
  name: string;
  block: "inputs" | "options" | "outputs";
  title: string;
  usedBy: { stepName: string; variable: string }[];
  mimeTypes: string[];
}

/** Every step variable neither set literally nor fed by a prior step becomes a workflow variable. */
export const deriveWorkflowVariables = (model: WorkflowModel): DerivedVariable[] => {
  const byName = new Map<string, DerivedVariable>();

  for (const step of model.steps) {
    const jobDef = findJob(step);
    for (const binding of step.plumbing) {
      if (binding.kind !== "from-workflow") {
        continue;
      }
      const input = jobDef?.inputs.find((i) => i.name === binding.variable);
      const output = jobDef?.outputs.find((o) => o.key === binding.variable);
      const option = jobDef?.options.find((o) => o.name === binding.variable);

      const block: DerivedVariable["block"] = input ? "inputs" : output ? "outputs" : "options";
      const existing = byName.get(binding.workflowVariable);
      if (existing) {
        existing.usedBy.push({ stepName: step.name, variable: binding.variable });
        continue;
      }
      byName.set(binding.workflowVariable, {
        name: binding.workflowVariable,
        block,
        title: input?.title ?? option?.title ?? output?.title ?? binding.variable,
        usedBy: [{ stepName: step.name, variable: binding.variable }],
        mimeTypes: input?.mimeTypes ?? output?.mimeTypes ?? [],
      });
    }
  }

  return [...byName.values()];
};

// --- wiring sources --------------------------------------------------------------------------

export interface StepSource {
  kind: "from-step";
  id: string;
  stepName: string;
  stepIndex: number;
  outputKey: string;
  label: string;
  arity: Arity;
  mimeMatch: boolean;
  /** False when this connection needs workflow-engine#42 to resolve its path. */
  resolves: boolean;
}

export interface WorkflowSource {
  kind: "from-workflow";
  id: string;
  workflowVariable: string;
  label: string;
  mimeMatch: boolean;
}

export type WiringSource = StepSource | WorkflowSource;

/**
 * Everything step `stepIndex` could legally take `input` from: any output of any *earlier* step,
 * plus the workflow's own inputs. Incompatible arities are omitted entirely; mime-type mismatches
 * are included but flagged, because plenty of Job definitions omit `mime-types`.
 */
export const getWiringSources = (
  model: WorkflowModel,
  stepIndex: number,
  input: JobInput,
): WiringSource[] => {
  const sources: WiringSource[] = [];

  for (const [index, step] of model.steps.entries()) {
    if (index >= stepIndex) {
      break;
    }
    const jobDef = findJob(step);
    for (const output of jobDef?.outputs ?? []) {
      const arity = arityOf(output, input);
      if (!arity) {
        continue;
      }
      sources.push({
        kind: "from-step",
        id: `${step.name}.${output.key}`,
        stepName: step.name,
        stepIndex: index,
        outputKey: output.key,
        label: `${index + 1}. ${step.name} → ${output.title}`,
        arity,
        mimeMatch: mimesIntersect(output.mimeTypes, input.mimeTypes),
        resolves: arity !== "one-to-one" || isOutputWirable(output),
      });
    }
  }

  for (const variable of deriveWorkflowVariables(model)) {
    if (variable.block !== "inputs") {
      continue;
    }
    sources.push({
      kind: "from-workflow",
      id: `$${variable.name}`,
      workflowVariable: variable.name,
      label: `Workflow input: ${variable.name}`,
      mimeMatch: mimesIntersect(variable.mimeTypes, input.mimeTypes),
    });
  }

  return sources;
};

/** The id of the source a binding currently points at, for pre-selecting the picker. */
export const sourceIdOf = (binding: Binding | undefined) => {
  if (binding?.kind === "from-step") {
    return `${binding.stepName}.${binding.outputKey}`;
  }
  if (binding?.kind === "from-workflow") {
    return `$${binding.workflowVariable}`;
  }
  return "";
};

/** Rebind one input of one step, keeping the plumbing order stable so the YAML does not jump. */
export const applySource = (
  model: WorkflowModel,
  stepIndex: number,
  variable: string,
  sourceId: string,
): WorkflowModel => {
  const step = model.steps[stepIndex];
  const at = step.plumbing.findIndex((b) => b.variable === variable);

  let replacement: Binding | undefined;
  if (sourceId.startsWith("$")) {
    replacement = { variable, kind: "from-workflow", workflowVariable: sourceId.slice(1) };
  } else if (sourceId.includes(".")) {
    const [stepName, outputKey] = sourceId.split(".");
    replacement = { variable, kind: "from-step", stepName, outputKey };
  }

  const plumbing = [...step.plumbing];
  if (replacement) {
    if (at === -1) {
      plumbing.push(replacement);
    } else {
      plumbing[at] = replacement;
    }
  } else if (at !== -1) {
    plumbing.splice(at, 1);
  }

  return {
    ...model,
    steps: model.steps.map((s, index) => (index === stepIndex ? { ...s, plumbing } : s)),
  };
};

/** Short badge for a step's parallelism state, or null when it just runs once. */
export const shapeLabel = (shape: StepShape | undefined) => {
  if (shape?.combiner) {
    return `combines ${shape.combines ?? ""}`.trim();
  }
  if (shape?.replicated) {
    return "runs once per file";
  }
  if (shape?.splits) {
    return "splits";
  }
  return null;
};

// --- issues ----------------------------------------------------------------------------------

export interface Issue {
  id: string;
  level: "error" | "warning";
  stepName?: string;
  message: string;
}

export const findIssues = (model: WorkflowModel): Issue[] => {
  const issues: Omit<Issue, "id">[] = [];
  const shapes = deriveStepShapes(model);
  const indexByName = new Map(model.steps.map((step, index) => [step.name, index]));

  const seen = new Set<string>();
  for (const [index, step] of model.steps.entries()) {
    if (seen.has(step.name)) {
      issues.push({ level: "error", stepName: step.name, message: "Duplicate step name" });
    }
    seen.add(step.name);

    const jobDef = findJob(step);
    if (!jobDef) {
      issues.push({ level: "error", stepName: step.name, message: "Job not found in the DM" });
      continue;
    }

    for (const option of jobDef.options) {
      const set =
        option.name in step.variables || step.plumbing.some((b) => b.variable === option.name);
      if (option.required && !set) {
        issues.push({
          level: "error",
          stepName: step.name,
          message: `Required variable "${option.name}" has no value`,
        });
      }
    }

    for (const input of jobDef.inputs) {
      if (input.required && !step.plumbing.some((b) => b.variable === input.name)) {
        issues.push({
          level: "error",
          stepName: step.name,
          message: `Input "${input.name}" is not wired`,
        });
      }
    }

    let filesInputs = 0;
    const combinedSteps = new Set<string>();

    for (const binding of step.plumbing) {
      if (binding.kind !== "from-step") {
        continue;
      }
      const sourceIndex = indexByName.get(binding.stepName);
      if (sourceIndex === undefined) {
        issues.push({
          level: "error",
          stepName: step.name,
          message: `"${binding.stepName}" is not a step in this workflow`,
        });
        continue;
      }
      if (sourceIndex >= index) {
        issues.push({
          level: "error",
          stepName: step.name,
          message:
            sourceIndex === index
              ? `"${binding.variable}" is wired to this step's own output`
              : `"${binding.variable}" is wired to "${binding.stepName}", which runs later`,
        });
        continue;
      }

      const source = model.steps[sourceIndex];
      const output = findJob(source)?.outputs.find((o) => o.key === binding.outputKey);
      const input = jobDef.inputs.find((i) => i.name === binding.variable);
      if (!output || !input) {
        continue;
      }

      const arity = arityOf(output, input);
      if (!arity) {
        issues.push({
          level: "error",
          stepName: step.name,
          message: `"${binding.stepName}.${binding.outputKey}" and "${binding.variable}" are both multi-file — the engine cannot connect them`,
        });
        continue;
      }
      if (arity === "fan-in") {
        filesInputs += 1;
        combinedSteps.add(binding.stepName);
      }
      if (arity === "one-to-one" && !isOutputWirable(output)) {
        issues.push({
          level: "warning",
          stepName: step.name,
          message: `"${binding.stepName}.${binding.outputKey}" needs workflow-engine#42 — the file path will not resolve at run time`,
        });
      }
      if (!mimesIntersect(output.mimeTypes, input.mimeTypes)) {
        issues.push({
          level: "warning",
          stepName: step.name,
          message: `"${binding.stepName}.${binding.outputKey}" declares ${output.mimeTypes.join(", ")}, which "${binding.variable}" does not accept`,
        });
      }
    }

    if (filesInputs > 1 || combinedSteps.size > 1) {
      issues.push({
        level: "error",
        stepName: step.name,
        message:
          "A step can only combine one prior step — the engine acts on the first and ignores the rest",
      });
    }

    // The adjacency rule: the engine launches steps[i+1] once per completing replica of steps[i].
    const shape = shapes.get(step.name);
    if (shape?.replicated) {
      if (index + 1 >= model.steps.length) {
        issues.push({
          level: "warning",
          stepName: step.name,
          message:
            "The workflow ends while still fanned out — the replica outputs are never recombined",
        });
      } else {
        const next = model.steps[index + 1];
        const nextShape = shapes.get(next.name);
        if (!nextShape?.combiner || nextShape.combines !== step.name) {
          issues.push({
            level: "error",
            stepName: next.name,
            message: `"${step.name}" runs once per file, so this step must combine it — otherwise the engine launches this step once per replica, each time using only the first`,
          });
        }
      }
    }
  }

  return issues.map((issue, index) => ({ ...issue, id: `${index}-${issue.stepName ?? ""}` }));
};

// --- emit ------------------------------------------------------------------------------------

export const emitYaml = (model: WorkflowModel) =>
  stringify({
    kind: "DataManagerWorkflow",
    "kind-version": "2025.2",
    name: model.definitionName,
    description: model.description,
    variables: deriveWorkflowVariables(model).reduce<Record<string, unknown>>((acc, variable) => {
      const block = (acc[variable.block] ??= { type: "object", properties: {} }) as {
        properties: Record<string, unknown>;
      };
      block.properties[variable.name] = {
        title: variable.title,
        ...(variable.mimeTypes.length > 0 ? { "mime-types": variable.mimeTypes } : {}),
        type: variable.block === "options" ? "string" : "file",
      };
      return acc;
    }, {}),
    steps: model.steps.map((step) => ({
      name: step.name,
      description: step.description,
      specification: {
        collection: step.collection,
        job: step.job,
        version: step.version,
        ...(Object.keys(step.variables).length > 0 ? { variables: step.variables } : {}),
      },
      ...(step.plumbing.length > 0
        ? {
            plumbing: step.plumbing.map((binding) =>
              binding.kind === "from-step"
                ? {
                    variable: binding.variable,
                    "from-step": { name: binding.stepName, variable: binding.outputKey },
                  }
                : binding.kind === "from-workflow"
                  ? {
                      variable: binding.variable,
                      "from-workflow": { variable: binding.workflowVariable },
                    }
                  : {
                      variable: binding.variable,
                      "from-predefined": { variable: binding.predefined },
                    },
            ),
          }
        : {}),
    })),
  });
