/**
 * PROTOTYPE — THROWAWAY CODE.
 *
 * Variant B — "Vertical pipeline". No side panels at all. One centred column that reads
 * top-to-bottom in exactly the order the engine executes, with the data connections drawn
 * *between* the step cards rather than hidden inside a form. Steps expand in place; the YAML
 * lives in a bottom sheet.
 *
 * The bet: for an engine that runs steps in written order, the pipeline itself is the primary
 * affordance, and seeing "chunks flow into properties" is worth more than a dense editor.
 *
 * The complication this variant has to answer (plan §1): wiring is *not* limited to the previous
 * step. A connection from the step directly above is drawn on the spine; anything reaching further
 * back is drawn as an inbound jump on the card itself, because the spine would otherwise imply a
 * connection that is not there.
 */

import { Fragment, useState } from "react";

import {
  Add,
  ArrowDownward,
  CallMerge,
  CallSplit,
  Code,
  SubdirectoryArrowRight,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  applySource,
  ARITY_LABEL,
  arityOf,
  type Binding,
  deriveStepShapes,
  deriveWorkflowVariables,
  emitYaml,
  findIssues,
  findJob,
  getWiringSources,
  isOutputWirable,
  shapeLabel,
  sourceIdOf,
  type WorkflowModel,
} from "./stubData";

export const VARIANT_B_NAME = "Vertical pipeline";

interface Inbound {
  id: string;
  label: string;
  detail: string;
  warn: boolean;
  fan: "in" | "out" | null;
  fromIndex: number | null;
}

const Connector = ({ inbound }: { inbound: Inbound | null }) => {
  const colour = inbound?.warn ? "warning.main" : "divider";
  return (
    <Stack sx={{ alignItems: "center", paddingY: 0.5 }}>
      <Box sx={{ backgroundColor: colour, height: 16, width: 2 }} />
      <Chip
        color={inbound?.warn ? "warning" : inbound?.fan ? "info" : "default"}
        icon={
          inbound?.fan === "out" ? (
            <CallSplit />
          ) : inbound?.fan === "in" ? (
            <CallMerge />
          ) : (
            <ArrowDownward />
          )
        }
        label={inbound?.label ?? "runs next"}
        size="small"
        variant={inbound ? "filled" : "outlined"}
      />
      <Box sx={{ backgroundColor: colour, height: 16, width: 2 }} />
    </Stack>
  );
};

const Terminal = ({ title, names }: { title: string; names: string[] }) => (
  <Paper
    sx={{ backgroundColor: "action.hover", borderStyle: "dashed", padding: 2 }}
    variant="outlined"
  >
    <Typography gutterBottom variant="overline">
      {title}
    </Typography>
    <Stack useFlexGap direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {names.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          None
        </Typography>
      )}
      {names.map((name) => (
        <Chip key={name} label={name} size="small" />
      ))}
    </Stack>
  </Paper>
);

export const VariantB = ({ model: initialModel }: { model: WorkflowModel }) => {
  const [model, setModel] = useState(initialModel);
  const [expanded, setExpanded] = useState<string | null>("properties");
  const [showYaml, setShowYaml] = useState(false);

  const issues = findIssues(model);
  const variables = deriveWorkflowVariables(model);
  const shapes = deriveStepShapes(model);

  const describe = (stepIndex: number, binding: Binding): Inbound => {
    const step = model.steps[stepIndex];
    const jobDef = findJob(step);

    if (binding.kind === "from-workflow") {
      return {
        id: binding.variable,
        label: `$${binding.workflowVariable} → ${binding.variable}`,
        detail: "workflow input",
        warn: false,
        fan: null,
        fromIndex: null,
      };
    }
    if (binding.kind === "from-predefined") {
      return {
        id: binding.variable,
        label: `@${binding.predefined} → ${binding.variable}`,
        detail: "predefined",
        warn: false,
        fan: null,
        fromIndex: null,
      };
    }

    const fromIndex = model.steps.findIndex((s) => s.name === binding.stepName);
    const source = fromIndex === -1 ? undefined : model.steps[fromIndex];
    const output = source
      ? findJob(source)?.outputs.find((o) => o.key === binding.outputKey)
      : undefined;
    const input = jobDef?.inputs.find((i) => i.name === binding.variable);
    const arity = output && input ? arityOf(output, input) : null;

    return {
      id: binding.variable,
      label: `${output?.title ?? binding.outputKey} → ${binding.variable}`,
      detail: `step ${fromIndex + 1} · ${binding.stepName}${arity ? ` · ${ARITY_LABEL[arity]}` : ""}`,
      warn: arity === "one-to-one" && !!output && !isOutputWirable(output),
      fan: arity === "fan-out" ? "out" : arity === "fan-in" ? "in" : null,
      fromIndex,
    };
  };

  return (
    <Box sx={{ height: "100vh", overflowY: "auto", paddingBottom: 12 }}>
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <Box sx={{ margin: "0 auto", maxWidth: 880, paddingX: 2, paddingY: 1.5 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{model.recordName}</Typography>
              <Typography color="text.secondary" variant="caption">
                {model.definitionName} · {model.scope} · {model.steps.length} steps
              </Typography>
            </Box>
            <Button startIcon={<Code />} onClick={() => setShowYaml((open) => !open)}>
              YAML
            </Button>
            <Button variant="contained">Save</Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ margin: "0 auto", maxWidth: 880, paddingX: 2, paddingY: 3 }}>
        <Terminal
          names={variables.filter((v) => v.block !== "outputs").map((v) => v.name)}
          title="Workflow inputs — supplied when the workflow is run"
        />

        {model.steps.map((step, index) => {
          const jobDef = findJob(step);
          const stepIssues = issues.filter((i) => i.stepName === step.name);
          const isOpen = expanded === step.name;
          const shape = shapes.get(step.name);

          const inbound = step.plumbing.map((binding) => describe(index, binding));
          const spine = inbound.find((i) => i.fromIndex === index - 1) ?? null;
          const jumps = inbound.filter((i) => i !== spine);

          return (
            <Fragment key={step.name}>
              <Connector inbound={spine} />

              <Paper
                sx={{
                  borderColor: stepIssues.some((i) => i.level === "error")
                    ? "error.main"
                    : undefined,
                }}
                variant="outlined"
              >
                <Box
                  sx={{ cursor: "pointer", padding: 2 }}
                  onClick={() => setExpanded(isOpen ? null : step.name)}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Chip label={index + 1} size="small" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1">{step.name}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {jobDef?.name} · {step.collection} v{step.version}
                      </Typography>
                    </Box>
                    {!!shapeLabel(shape) && (
                      <Chip
                        color="info"
                        icon={shape?.combiner ? <CallMerge /> : <CallSplit />}
                        label={shapeLabel(shape)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {stepIssues.map((issue) => (
                      <Tooltip key={issue.id} title={issue.message}>
                        <Warning color={issue.level} fontSize="small" />
                      </Tooltip>
                    ))}
                  </Stack>

                  {jumps.length > 0 && (
                    <Stack spacing={0.5} sx={{ paddingLeft: 5, paddingTop: 1 }}>
                      {jumps.map((jump) => (
                        <Stack
                          direction="row"
                          key={jump.id}
                          spacing={1}
                          sx={{ alignItems: "center" }}
                        >
                          <SubdirectoryArrowRight
                            color={jump.warn ? "warning" : "disabled"}
                            fontSize="small"
                          />
                          <Chip
                            color={jump.warn ? "warning" : jump.fan ? "info" : "default"}
                            label={jump.label}
                            size="small"
                            variant="outlined"
                          />
                          <Typography color="text.secondary" variant="caption">
                            {jump.detail}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Collapse unmountOnExit in={isOpen}>
                  <Divider />
                  <Stack spacing={2} sx={{ padding: 2 }}>
                    {stepIssues.map((issue) => (
                      <Alert key={issue.id} severity={issue.level}>
                        {issue.message}
                      </Alert>
                    ))}

                    {jobDef?.inputs.map((input) => {
                      const binding = step.plumbing.find((b) => b.variable === input.name);
                      const sources = getWiringSources(model, index, input);
                      const value = sourceIdOf(binding);
                      const active = sources.find((s) => s.id === value);
                      return (
                        <TextField
                          fullWidth
                          select
                          helperText={
                            active?.kind === "from-step"
                              ? ARITY_LABEL[active.arity]
                              : `${sources.length} source${sources.length === 1 ? "" : "s"} available from earlier steps and workflow inputs`
                          }
                          key={input.name}
                          label={`${input.title} — comes from`}
                          size="small"
                          value={value}
                          onChange={(event) =>
                            setModel((current) =>
                              applySource(current, index, input.name, event.target.value),
                            )
                          }
                        >
                          <MenuItem value="">Not wired</MenuItem>
                          {sources.map((source) => (
                            <MenuItem key={source.id} value={source.id}>
                              {source.label}
                              {source.kind === "from-step" && source.arity !== "one-to-one"
                                ? ` — ${source.arity}`
                                : ""}
                            </MenuItem>
                          ))}
                        </TextField>
                      );
                    })}

                    {jobDef?.options.map((option) => (
                      <TextField
                        fullWidth
                        key={option.name}
                        label={option.title}
                        required={option.required}
                        size="small"
                        value={String(step.variables[option.name] ?? "")}
                      />
                    ))}

                    <Box>
                      <Typography gutterBottom variant="overline">
                        Produces
                      </Typography>
                      <Stack useFlexGap direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                        {jobDef?.outputs.map((output) => (
                          <Chip
                            color={isOutputWirable(output) ? "default" : "warning"}
                            icon={output.type === "files" ? <CallSplit /> : undefined}
                            key={output.key}
                            label={
                              output.type === "files" ? `${output.title} — many` : output.title
                            }
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Collapse>
              </Paper>
            </Fragment>
          );
        })}

        <Connector inbound={null} />
        <Terminal
          names={variables.filter((v) => v.block === "outputs").map((v) => v.name)}
          title="Workflow outputs — written back to the project"
        />

        <Box sx={{ display: "flex", justifyContent: "center", paddingTop: 3 }}>
          <Button startIcon={<Add />} variant="outlined">
            Add step
          </Button>
        </Box>
      </Box>

      <Collapse
        in={showYaml}
        sx={{
          backgroundColor: "background.paper",
          borderColor: "divider",
          borderTop: 1,
          bottom: 0,
          left: 0,
          maxHeight: "45vh",
          overflowY: "auto",
          position: "fixed",
          right: 0,
          zIndex: 3,
        }}
      >
        <Box component="pre" sx={{ fontSize: 12, margin: 0, padding: 2 }}>
          {emitYaml(model)}
        </Box>
      </Collapse>
    </Box>
  );
};
