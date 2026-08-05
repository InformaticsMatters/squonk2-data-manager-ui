/**
 * PROTOTYPE — THROWAWAY CODE.
 *
 * Variant C — "Table + inspector". The workflow is a dense table: one row per step, every
 * binding visible as a cell, readiness scannable down a column. Selecting a row opens an
 * inspector on the right. Workflow variables and YAML are peer tabs of the table, not a drawer.
 *
 * The bet: authoring a workflow is closer to editing a spreadsheet than filling in a form, and
 * the thing authors do most is scan "is everything wired?" across many steps at once.
 */

import { useState } from "react";

import { Add, Close, Warning } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import {
  applySource,
  ARITY_LABEL,
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

export const VARIANT_C_NAME = "Table + inspector";

const bindingLabel = (binding: Binding) =>
  binding.kind === "from-step"
    ? `${binding.stepName}.${binding.outputKey}`
    : binding.kind === "from-workflow"
      ? `$${binding.workflowVariable}`
      : `@${binding.predefined}`;

export const VariantC = ({ model: initialModel }: { model: WorkflowModel }) => {
  const [model, setModel] = useState(initialModel);
  const [tab, setTab] = useState(0);
  const [inspected, setInspected] = useState<string | null>("score");

  const issues = findIssues(model);
  const variables = deriveWorkflowVariables(model);
  const shapes = deriveStepShapes(model);
  const stepIndex = model.steps.findIndex((s) => s.name === inspected);
  const step = stepIndex === -1 ? undefined : model.steps[stepIndex];
  const jobDef = step ? findJob(step) : undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          paddingX: 2,
          paddingY: 1,
        }}
      >
        <Typography variant="h6">{model.recordName}</Typography>
        <Chip label={model.definitionName} size="small" variant="outlined" />
        <Chip label={model.scope} size="small" />
        <Box sx={{ flexGrow: 1 }} />
        {issues.some((i) => i.level === "error") && (
          <Chip
            color="error"
            label={`${issues.filter((i) => i.level === "error").length} errors`}
            size="small"
          />
        )}
        {issues.some((i) => i.level === "warning") && (
          <Chip
            color="warning"
            label={`${issues.filter((i) => i.level === "warning").length} warnings`}
            size="small"
          />
        )}
        <Button size="small" startIcon={<Add />}>
          Add step
        </Button>
        <Button size="small" variant="contained">
          Save
        </Button>
      </Stack>

      <Box sx={{ display: "flex", flexGrow: 1, minHeight: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
          <Tabs
            sx={{ borderBottom: 1, borderColor: "divider" }}
            value={tab}
            onChange={(_, value: number) => setTab(value)}
          >
            <Tab label={`Steps (${model.steps.length})`} />
            <Tab label={`Workflow variables (${variables.length})`} />
            <Tab label="YAML" />
          </Tabs>

          <Box sx={{ flexGrow: 1, overflow: "auto" }}>
            {tab === 0 && (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={40}>#</TableCell>
                    <TableCell>Step</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Bindings</TableCell>
                    <TableCell>Produces</TableCell>
                    <TableCell>Runs</TableCell>
                    <TableCell width={80}>State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {model.steps.map((s, index) => {
                    const rowJob = findJob(s);
                    const rowIssues = issues.filter((i) => i.stepName === s.name);
                    return (
                      <TableRow
                        hover
                        key={s.name}
                        selected={s.name === inspected}
                        sx={{ cursor: "pointer" }}
                        onClick={() => setInspected(s.name)}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>
                          {s.collection} | {s.job}
                        </TableCell>
                        <TableCell>{s.version}</TableCell>
                        <TableCell>
                          <Stack useFlexGap direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                            {s.plumbing.map((binding) => {
                              const from =
                                binding.kind === "from-step"
                                  ? model.steps.findIndex((t) => t.name === binding.stepName)
                                  : -1;
                              return (
                                <Chip
                                  color={from >= 0 && from < index - 1 ? "info" : "default"}
                                  key={binding.variable}
                                  label={`${binding.variable} ← ${from >= 0 ? `${from + 1}. ` : ""}${bindingLabel(binding)}`}
                                  size="small"
                                  variant="outlined"
                                />
                              );
                            })}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack useFlexGap direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                            {rowJob?.outputs.map((output) => (
                              <Chip
                                color={isOutputWirable(output) ? "default" : "warning"}
                                key={output.key}
                                label={output.type === "files" ? `${output.key} ⇉` : output.key}
                                size="small"
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {shapeLabel(shapes.get(s.name)) ? (
                            <Chip
                              color="info"
                              label={shapeLabel(shapes.get(s.name))}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Typography color="text.secondary" variant="caption">
                              once
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {rowIssues.length === 0 ? (
                            <Chip color="success" label="ok" size="small" />
                          ) : (
                            <Stack direction="row" spacing={0.5}>
                              <Warning
                                color={
                                  rowIssues.some((i) => i.level === "error") ? "error" : "warning"
                                }
                                fontSize="small"
                              />
                              <Typography variant="caption">{rowIssues.length}</Typography>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {tab === 1 && (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Block</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Used by</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variables.map((variable) => (
                    <TableRow key={variable.name}>
                      <TableCell>{variable.name}</TableCell>
                      <TableCell>
                        <Chip label={variable.block} size="small" />
                      </TableCell>
                      <TableCell>{variable.title}</TableCell>
                      <TableCell>
                        {variable.usedBy.map((u) => `${u.stepName}.${u.variable}`).join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {tab === 2 && (
              <Box component="pre" sx={{ fontSize: 12, margin: 0, padding: 2 }}>
                {emitYaml(model)}
              </Box>
            )}
          </Box>
        </Box>

        {!!step && !!jobDef && (
          <Box
            sx={{
              borderColor: "divider",
              borderLeft: 1,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              width: 420,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", padding: 2, paddingBottom: 1 }}
            >
              <Typography sx={{ flexGrow: 1 }} variant="subtitle1">
                {step.name}
              </Typography>
              <IconButton size="small" onClick={() => setInspected(null)}>
                <Close fontSize="small" />
              </IconButton>
            </Stack>
            <Divider />
            <Stack spacing={2} sx={{ padding: 2 }}>
              <Typography color="text.secondary" variant="body2">
                {jobDef.description}
              </Typography>
              {issues
                .filter((i) => i.stepName === step.name)
                .map((issue) => (
                  <Alert key={issue.id} severity={issue.level}>
                    {issue.message}
                  </Alert>
                ))}
              <TextField fullWidth label="Step name" size="small" value={step.name} />

              <Divider textAlign="left">
                <Typography color="text.secondary" variant="overline">
                  Inputs
                </Typography>
              </Divider>
              {jobDef.inputs.map((input) => {
                const binding = step.plumbing.find((b) => b.variable === input.name);
                const sources = getWiringSources(model, stepIndex, input);
                const value = sourceIdOf(binding);
                const active = sources.find((s) => s.id === value);
                return (
                  <TextField
                    fullWidth
                    select
                    helperText={
                      active?.kind === "from-step"
                        ? ARITY_LABEL[active.arity]
                        : `${sources.length} compatible source${sources.length === 1 ? "" : "s"}`
                    }
                    key={input.name}
                    label={input.title}
                    size="small"
                    value={value}
                    onChange={(event) =>
                      setModel((current) =>
                        applySource(current, stepIndex, input.name, event.target.value),
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

              <Divider textAlign="left">
                <Typography color="text.secondary" variant="overline">
                  Options
                </Typography>
              </Divider>
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
        )}
      </Box>
    </Box>
  );
};
