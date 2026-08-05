/**
 * PROTOTYPE — THROWAWAY CODE.
 *
 * Variant A — "Two-pane + drawer". The layout agreed in docs/workflow-builder-plan.md §4.
 * Step list on the left, one step in focus in the centre, a tabbed drawer on the right for the
 * things that are about the workflow rather than the step.
 */

import { useState } from "react";

import { Add, ArrowDownward, ArrowUpward, CallMerge, CallSplit, Delete } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import {
  applySource,
  ARITY_LABEL,
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

export const VARIANT_A_NAME = "Two-pane + drawer";

export const VariantA = ({ model: initialModel }: { model: WorkflowModel }) => {
  const [model, setModel] = useState(initialModel);
  const [selected, setSelected] = useState(2);
  const [tab, setTab] = useState(0);

  const step = model.steps[selected];
  const jobDef = findJob(step);
  const issues = findIssues(model);
  const variables = deriveWorkflowVariables(model);
  const shapes = deriveStepShapes(model);
  const stepIssues = issues.filter((i) => i.stepName === step.name);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Box
        sx={{
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          gap: 2,
          paddingX: 2,
          paddingY: 1.5,
        }}
      >
        <TextField
          label="Workflow name"
          size="small"
          sx={{ width: 280 }}
          value={model.recordName}
        />
        <Chip label={model.definitionName} size="small" variant="outlined" />
        <TextField select label="Scope" size="small" sx={{ width: 160 }} value={model.scope}>
          <MenuItem value="GLOBAL">Global</MenuItem>
          <MenuItem value="AS_ORGANISATION">Organisation</MenuItem>
          <MenuItem value="AS_PROJECT">Project</MenuItem>
        </TextField>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          color={issues.some((i) => i.level === "error") ? "error" : "success"}
          label={
            issues.length === 0 ? "Valid" : `${issues.length} issue${issues.length > 1 ? "s" : ""}`
          }
          size="small"
        />
        <Button variant="contained">Save</Button>
      </Box>

      <Box sx={{ display: "flex", flexGrow: 1, minHeight: 0 }}>
        <Box
          sx={{
            borderColor: "divider",
            borderRight: 1,
            display: "flex",
            flexDirection: "column",
            width: 280,
          }}
        >
          <Typography sx={{ padding: 2, paddingBottom: 1 }} variant="overline">
            Steps — run in order
          </Typography>
          <List dense sx={{ flexGrow: 1, overflowY: "auto" }}>
            {model.steps.map((s, index) => {
              const errors = issues.filter((i) => i.stepName === s.name && i.level === "error");
              const shape = shapes.get(s.name);
              return (
                <ListItemButton
                  key={s.name}
                  selected={index === selected}
                  onClick={() => setSelected(index)}
                >
                  <ListItemText
                    primary={`${index + 1}. ${s.name}`}
                    secondary={shapeLabel(shape) ?? `${s.collection} | ${s.job}`}
                    slotProps={{
                      secondary: {
                        color: shapeLabel(shape) ? "info.main" : undefined,
                        noWrap: true,
                      },
                    }}
                  />
                  {!!shape?.replicated && <CallSplit color="info" fontSize="small" />}
                  {!!shape?.combiner && <CallMerge color="info" fontSize="small" />}
                  {errors.length > 0 && <Chip color="error" label={errors.length} size="small" />}
                </ListItemButton>
              );
            })}
          </List>
          <Divider />
          <Button fullWidth startIcon={<Add />} sx={{ borderRadius: 0, paddingY: 1.5 }}>
            Add step
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: "auto", padding: 3 }}>
          {!!jobDef && (
            <Stack spacing={3}>
              <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="h5">{step.name}</Typography>
                    {!!shapeLabel(shapes.get(step.name)) && (
                      <Chip
                        color="info"
                        icon={shapes.get(step.name)?.combiner ? <CallMerge /> : <CallSplit />}
                        label={shapeLabel(shapes.get(step.name))}
                        size="small"
                      />
                    )}
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    {jobDef.name} · {jobDef.collection} · v{jobDef.version}
                  </Typography>
                </Box>
                <IconButton disabled={selected === 0}>
                  <ArrowUpward />
                </IconButton>
                <IconButton disabled={selected === model.steps.length - 1}>
                  <ArrowDownward />
                </IconButton>
                <IconButton color="error">
                  <Delete />
                </IconButton>
              </Box>

              {stepIssues.map((issue) => (
                <Alert key={issue.id} severity={issue.level}>
                  {issue.message}
                </Alert>
              ))}

              <Box>
                <Typography gutterBottom variant="subtitle1">
                  Inputs
                </Typography>
                <Typography gutterBottom color="text.secondary" variant="body2">
                  Any output of any earlier step, or a workflow input. Not just the step above.
                </Typography>
                <Stack spacing={2}>
                  {jobDef.inputs.map((input) => {
                    const binding = step.plumbing.find((b) => b.variable === input.name);
                    const sources = getWiringSources(model, selected, input);
                    const value = sourceIdOf(binding);
                    const active = sources.find((s) => s.id === value);
                    return (
                      <TextField
                        fullWidth
                        select
                        helperText={
                          active?.kind === "from-step"
                            ? ARITY_LABEL[active.arity]
                            : `${sources.length} compatible source${sources.length === 1 ? "" : "s"} · ${input.mimeTypes.join(", ")}`
                        }
                        key={input.name}
                        label={input.title}
                        size="small"
                        value={value}
                        onChange={(event) =>
                          setModel((current) =>
                            applySource(current, selected, input.name, event.target.value),
                          )
                        }
                      >
                        <MenuItem value="">Not wired</MenuItem>
                        {sources.map((source) => (
                          <MenuItem key={source.id} value={source.id}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                              <span>{source.label}</span>
                              {source.kind === "from-step" && source.arity !== "one-to-one" && (
                                <Chip color="info" label={source.arity} size="small" />
                              )}
                              {!source.mimeMatch && (
                                <Chip
                                  color="warning"
                                  label="type mismatch"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {source.kind === "from-step" && !source.resolves && (
                                <Chip
                                  color="warning"
                                  label="needs #42"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>
                    );
                  })}
                </Stack>
              </Box>

              <Box>
                <Typography gutterBottom variant="subtitle1">
                  Options
                </Typography>
                <Stack spacing={2}>
                  {jobDef.options.map((option) => (
                    <TextField
                      fullWidth
                      key={option.name}
                      label={option.title}
                      required={option.required}
                      size="small"
                      value={String(step.variables[option.name] ?? "")}
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography gutterBottom variant="subtitle1">
                  Produces
                </Typography>
                <Stack useFlexGap direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {jobDef.outputs.map((output) => (
                    <Chip
                      color={isOutputWirable(output) ? "default" : "warning"}
                      icon={output.type === "files" ? <CallSplit /> : undefined}
                      key={output.key}
                      label={`${output.title} (${output.key})${output.type === "files" ? " — many" : ""}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>

        <Box
          sx={{
            borderColor: "divider",
            borderLeft: 1,
            display: "flex",
            flexDirection: "column",
            width: 380,
          }}
        >
          <Tabs value={tab} onChange={(_, value: number) => setTab(value)}>
            <Tab label="Variables" />
            <Tab label="Issues" />
            <Tab label="YAML" />
          </Tabs>
          <Divider />
          <Box sx={{ flexGrow: 1, overflowY: "auto", padding: 2 }}>
            {tab === 0 && (
              <Stack spacing={2}>
                <Typography color="text.secondary" variant="body2">
                  Derived automatically. Rename here to change what the run form asks for.
                </Typography>
                {variables.map((variable) => (
                  <Paper key={variable.name} sx={{ padding: 1.5 }} variant="outlined">
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography sx={{ flexGrow: 1 }} variant="subtitle2">
                        {variable.name}
                      </Typography>
                      <Chip label={variable.block} size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {variable.usedBy.map((u) => `${u.stepName}.${u.variable}`).join(", ")}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
            {tab === 1 && (
              <Stack spacing={1}>
                {issues.length === 0 && <Alert severity="success">No issues</Alert>}
                {issues.map((issue) => (
                  <Alert key={issue.id} severity={issue.level}>
                    {issue.stepName ? <strong>{issue.stepName}: </strong> : null}
                    {issue.message}
                  </Alert>
                ))}
              </Stack>
            )}
            {tab === 2 && (
              <Box
                component="pre"
                sx={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {emitYaml(model)}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
