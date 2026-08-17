/**
 * PROTOTYPE — throwaway.
 *
 * Three variants of the Run catalogue's definition cards, switchable via `#variant=` on the
 * existing `/projects/[projectId]/run` route. The question they answer: the card's action row —
 * count badge, version select and Run button crammed into one wrapping footer — is a mess; what
 * should it be instead?
 *
 * Every variant keeps the real data, the real count rules and the real links. Only the rendering
 * differs. Nothing here is production code.
 */
import { type ReactNode, useMemo, useState } from "react";

import {
  ErrorOutlined as ErrorOutlinedIcon,
  History as HistoryIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Launch as LaunchIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import A from "next/link";

import { projectLinks, type RunState } from "../../../projects/routes";
import {
  countRunDefinitionExecutions,
  runDefinitionExecutionFilter,
  type RunDefinitionItem,
  type RunDefinitionSelection,
  runExecutionCountStatement,
  type RunExecutions,
} from "../../../projects/runFacts";
import { type ProjectRunCatalogue } from "../../../projects/useProjectRun";

const accents = { application: "#8e44ad", job: "#1976d2", workflow: "#f1c40f" } as const;

/** Readable text in the kind's own colour — the workflow yellow is unreadable as ink as it is. */
const inks = { application: "#6c3483", job: "#1565c0", workflow: "#8a6d0b" } as const;

const kindLabels = { application: "Application", job: "Job", workflow: "Workflow" } as const;

interface Described {
  accent: string;
  description?: string;
  ink: string;
  kindLabel: string;
  keywords: readonly string[];
  meta: readonly { label: string; value: string }[];
  subtitle: string;
  title: string;
}

/** One shape for all three definition kinds, so a variant lays out a card rather than three. */
const useDefinition = (item: RunDefinitionItem) => {
  const versions =
    item.kind === "job" ? item.data.map((job) => ({ id: String(job.id), label: job.version })) : [];
  const [selectedId, setSelectedId] = useState(versions[0]?.id ?? item.id);

  return useMemo(() => {
    if (item.kind === "job") {
      const job =
        item.data.find((candidate) => String(candidate.id) === selectedId) ?? item.data[0];
      const described: Described = {
        accent: accents.job,
        description: job.description ?? undefined,
        ink: inks.job,
        keywords: job.keywords ?? [],
        kindLabel: kindLabels.job,
        meta: [
          { label: "Category", value: job.category ?? "None" },
          { label: "Collection", value: job.collection },
        ],
        subtitle: job.name,
        title: job.job,
      };
      return {
        definitionId: String(job.id),
        described,
        docUrl: job.doc_url ?? undefined,
        selectedId: String(job.id),
        selection: { kind: "job", job } satisfies RunDefinitionSelection,
        setSelectedId,
        versions: item.data.map((version) => ({ id: String(version.id), label: version.version })),
      };
    }

    if (item.kind === "application") {
      const application = item.data;
      const described: Described = {
        accent: accents.application,
        ink: inks.application,
        keywords: [],
        kindLabel: kindLabels.application,
        meta: [{ label: "Group", value: application.group ?? "None" }],
        subtitle: application.group ?? "",
        title: application.kind,
      };
      return {
        definitionId: application.application_id,
        described,
        docUrl: undefined,
        selectedId,
        selection: { kind: "application", application } satisfies RunDefinitionSelection,
        setSelectedId,
        versions: [],
      };
    }

    const workflow = item.data;
    const described: Described = {
      accent: accents.workflow,
      description: workflow.workflow_description ?? undefined,
      ink: inks.workflow,
      keywords: [],
      kindLabel: kindLabels.workflow,
      meta: [{ label: "Version", value: workflow.version ?? "n/a" }],
      subtitle: workflow.name,
      title: workflow.workflow_name ?? workflow.name,
    };
    return {
      definitionId: workflow.id,
      described,
      docUrl: undefined,
      selectedId,
      selection: { kind: "workflow", workflow } satisfies RunDefinitionSelection,
      setSelectedId,
      versions: [],
    };
  }, [item, selectedId]);
};

/** The real count rules, drawn however a variant wants to draw them. */
const useExecutions = (
  executions: RunExecutions,
  selection: RunDefinitionSelection,
  projectId: string,
) => {
  const { filter, name } = runDefinitionExecutionFilter(selection);
  const count = countRunDefinitionExecutions(
    executions,
    runDefinitionExecutionFilter(selection).target,
  );
  const { description, text } = runExecutionCountStatement(count, name);

  return {
    count,
    description,
    href: projectLinks.results(projectId, { definition: filter }) as never,
    number: count.status === "counted" ? String(count.count) : undefined,
    text,
  };
};

const CountMark = ({ status }: { status: "pending" | "unreadable" }) =>
  status === "pending" ? (
    <CircularProgress size={12} />
  ) : (
    <ErrorOutlinedIcon color="error" sx={{ fontSize: 14 }} />
  );

// ---------------------------------------------------------------------------------------------
// Variant A — the count moves into the header, the footer becomes one unmissable Run bar.
// ---------------------------------------------------------------------------------------------

const VariantACard = ({
  executions,
  item,
  projectId,
  runState,
}: {
  executions: RunExecutions;
  item: RunDefinitionItem;
  projectId: string;
  runState: RunState;
}) => {
  const { definitionId, described, docUrl, selectedId, selection, setSelectedId, versions } =
    useDefinition(item);
  const counted = useExecutions(executions, selection, projectId);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        borderTop: "3px solid",
        borderTopColor: described.accent,
      }}
    >
      <CardHeader
        action={
          <Tooltip title={counted.description}>
            <Chip
              clickable
              aria-label={counted.description}
              component={A}
              href={counted.href}
              icon={<HistoryIcon sx={{ fontSize: 15 }} />}
              label={
                counted.number ?? (
                  <CountMark status={counted.count.status as "pending" | "unreadable"} />
                )
              }
              size="small"
              sx={{ mt: 0.5 }}
              variant="outlined"
            />
          </Tooltip>
        }
        avatar={
          <Avatar sx={{ backgroundColor: described.accent, fontFamily: "verdana" }}>
            {described.title.slice(0, 1).toUpperCase()}
          </Avatar>
        }
        slotProps={{ subheader: { variant: "caption" }, title: { variant: "subtitle2" } }}
        subheader={described.subtitle}
        title={described.title}
      />
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        <Typography
          sx={{ color: "text.secondary", fontWeight: "bold", letterSpacing: 0.6 }}
          variant="caption"
        >
          {described.kindLabel.toUpperCase()}
        </Typography>
        {!!described.description && (
          <Typography sx={{ mt: 0.5, textWrap: "pretty" }} variant="body2">
            {described.description}
            {!!docUrl && (
              <Tooltip title="View documentation">
                <a href={docUrl} rel="noopener noreferrer" target="_blank">
                  <LaunchIcon sx={{ fontSize: "0.8rem", ml: 0.5, verticalAlign: "middle" }} />
                </a>
              </Tooltip>
            )}
          </Typography>
        )}
        <Box sx={{ mt: 1.5 }}>
          {described.meta.map((entry) => (
            <Typography key={entry.label} sx={{ color: "text.secondary" }} variant="caption">
              {entry.label}: <strong>{entry.value}</strong>
              <br />
            </Typography>
          ))}
        </Box>
        {versions.length > 0 && (
          <TextField
            fullWidth
            select
            label="Version"
            size="small"
            sx={{ mt: 2 }}
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {versions.map((version) => (
              <MenuItem key={version.id} value={version.id}>
                {version.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </CardContent>
      <Button
        fullWidth
        component={A}
        href={projectLinks.runDefinition(projectId, item.definitionType, definitionId, runState)}
        size="large"
        startIcon={<PlayArrowIcon />}
        sx={{ borderRadius: 0, py: 1.25 }}
        variant="contained"
      >
        Run
      </Button>
    </Card>
  );
};

// ---------------------------------------------------------------------------------------------
// Variant B — a split footer toolbar: text-sized metadata on the left, one action on the right.
// ---------------------------------------------------------------------------------------------

const VersionMenuButton = ({
  onSelect,
  selectedId,
  versions,
}: {
  onSelect: (id: string) => void;
  selectedId: string;
  versions: readonly { id: string; label: string }[];
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const current = versions.find((version) => version.id === selectedId) ?? versions[0];

  return (
    <>
      <Button
        color="inherit"
        disabled={versions.length === 1}
        endIcon={versions.length > 1 ? <KeyboardArrowDownIcon /> : undefined}
        size="small"
        sx={{ color: "text.secondary", minWidth: 0, px: 0.5, textTransform: "none" }}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        v{current.label}
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {versions.map((version) => (
          <MenuItem
            key={version.id}
            selected={version.id === selectedId}
            onClick={() => {
              onSelect(version.id);
              setAnchor(null);
            }}
          >
            {version.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const VariantBCard = ({
  executions,
  item,
  projectId,
  runState,
}: {
  executions: RunExecutions;
  item: RunDefinitionItem;
  projectId: string;
  runState: RunState;
}) => {
  const { definitionId, described, selectedId, selection, setSelectedId, versions } =
    useDefinition(item);
  const counted = useExecutions(executions, selection, projectId);

  return (
    <Card sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ backgroundColor: described.accent, height: 4 }} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Chip
          label={described.kindLabel}
          size="small"
          sx={{
            backgroundColor: `${described.accent}22`,
            color: described.accent,
            fontWeight: 600,
            mb: 1,
          }}
        />
        <Typography sx={{ fontWeight: 600, lineHeight: 1.25 }} variant="subtitle1">
          {described.title}
        </Typography>
        <Typography sx={{ color: "text.secondary" }} variant="caption">
          {described.subtitle}
        </Typography>
        {!!described.description && (
          <Typography
            sx={{
              display: "-webkit-box",
              mt: 1,
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
            }}
            variant="body2"
          >
            {described.description}
          </Typography>
        )}
        {described.keywords.length > 0 && (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 1 }}>
            {described.keywords.slice(0, 3).map((word) => (
              <Chip key={word} label={word} size="small" variant="outlined" />
            ))}
          </Stack>
        )}
      </CardContent>
      <Divider />
      <CardActions
        sx={{
          alignItems: "center",
          display: "flex",
          gap: 0.5,
          justifyContent: "space-between",
          px: 1.5,
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", minWidth: 0 }}>
          {versions.length > 0 && (
            <>
              <VersionMenuButton
                selectedId={selectedId}
                versions={versions}
                onSelect={setSelectedId}
              />
              <Typography sx={{ color: "text.disabled", mx: 0.25 }} variant="caption">
                ·
              </Typography>
            </>
          )}
          <Tooltip title={counted.description}>
            <Button
              aria-label={counted.description}
              component={A}
              href={counted.href}
              size="small"
              startIcon={<HistoryIcon sx={{ fontSize: 15 }} />}
              sx={{ color: "text.secondary", minWidth: 0, px: 0.5, textTransform: "none" }}
            >
              {counted.number ?? (
                <CountMark status={counted.count.status as "pending" | "unreadable"} />
              )}
            </Button>
          </Tooltip>
        </Box>
        <Button
          component={A}
          href={projectLinks.runDefinition(projectId, item.definitionType, definitionId, runState)}
          size="small"
          variant="contained"
        >
          Run
        </Button>
      </CardActions>
    </Card>
  );
};

// ---------------------------------------------------------------------------------------------
// Variant D — A's top-right execution link, B's divided footer, nothing truncated. The whole of
// the original card's material is kept: description in full with its documentation link, category
// and collection, every keyword, the workflow's own version line.
// ---------------------------------------------------------------------------------------------

/** The kind label as text rather than an initial in an avatar, tinted by the kind's own colour. */
const KindLabel = ({ described }: { described: Described }) => (
  <Chip
    label={described.kindLabel}
    size="small"
    sx={{
      backgroundColor: `${described.accent}22`,
      color: described.ink,
      fontWeight: 700,
      letterSpacing: 0.3,
    }}
  />
);

const VariantDCard = ({
  executions,
  item,
  projectId,
  runState,
}: {
  executions: RunExecutions;
  item: RunDefinitionItem;
  projectId: string;
  runState: RunState;
}) => {
  const { definitionId, described, docUrl, selectedId, selection, setSelectedId, versions } =
    useDefinition(item);
  const counted = useExecutions(executions, selection, projectId);
  // The subtitle already says the group, so an application's card does not say it twice.
  const meta = described.kindLabel === kindLabels.application ? [] : described.meta;

  return (
    <Card sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ backgroundColor: described.accent, height: 4 }} />
      {/* The content grows, so a short card's footer still sits on the card's own bottom edge and
      every footer in the row lines up however tall its card had to be. */}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 1 }}>
          <KindLabel described={described} />
          <Tooltip title={counted.description}>
            <Chip
              clickable
              aria-label={counted.description}
              component={A}
              href={counted.href}
              icon={<HistoryIcon sx={{ fontSize: 15 }} />}
              label={
                counted.number ?? (
                  <CountMark status={counted.count.status as "pending" | "unreadable"} />
                )
              }
              size="small"
              sx={{ ml: "auto" }}
              variant="outlined"
            />
          </Tooltip>
        </Box>
        <Typography sx={{ fontWeight: 600, lineHeight: 1.3 }} variant="subtitle1">
          {described.title}
        </Typography>
        <Typography sx={{ color: "text.secondary", display: "block" }} variant="caption">
          {described.subtitle}
        </Typography>
        {/* Only a workflow said "No description" in the original UI; an application card carried no
        description line at all, so it still carries none. */}
        {(described.description !== undefined ||
          described.kindLabel === kindLabels.workflow) && (
          <Typography sx={{ mt: 1, textWrap: "pretty" }} variant="body2">
            {described.description ?? <em>No description</em>}
            {!!docUrl && (
              <Tooltip title="View documentation">
                <a href={docUrl} rel="noopener noreferrer" target="_blank">
                  <LaunchIcon sx={{ fontSize: "0.8rem", ml: 0.5, verticalAlign: "middle" }} />
                </a>
              </Tooltip>
            )}
          </Typography>
        )}
        {meta.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            {meta.map((entry) => (
              <Typography
                key={entry.label}
                sx={{ color: "text.secondary", display: "block" }}
                variant="caption"
              >
                {entry.label}: <strong>{entry.value}</strong>
              </Typography>
            ))}
          </Box>
        )}
        {described.keywords.length > 0 && (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
            {described.keywords.map((word) => (
              <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
            ))}
          </Stack>
        )}
      </CardContent>
      <Divider />
      <CardActions
        sx={{
          alignItems: "center",
          display: "flex",
          gap: 1,
          justifyContent: "space-between",
          px: 1.5,
        }}
      >
        {versions.length > 0 ? (
          <VersionMenuButton selectedId={selectedId} versions={versions} onSelect={setSelectedId} />
        ) : (
          <Box />
        )}
        <Button
          component={A}
          href={projectLinks.runDefinition(projectId, item.definitionType, definitionId, runState)}
          size="small"
          variant="contained"
        >
          Run
        </Button>
      </CardActions>
    </Card>
  );
};

// ---------------------------------------------------------------------------------------------
// Variant C — no cards at all. One dense row per definition, actions in a fixed right-hand rail.
// ---------------------------------------------------------------------------------------------

const VariantCRow = ({
  executions,
  item,
  projectId,
  runState,
}: {
  executions: RunExecutions;
  item: RunDefinitionItem;
  projectId: string;
  runState: RunState;
}) => {
  const { definitionId, described, selectedId, selection, setSelectedId, versions } =
    useDefinition(item);
  const counted = useExecutions(executions, selection, projectId);

  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        gap: 2,
        px: 2,
        py: 1.25,
        "&:hover": { backgroundColor: "action.hover" },
      }}
    >
      <Box
        sx={{
          backgroundColor: described.accent,
          borderRadius: 1,
          flexShrink: 0,
          height: 32,
          width: 4,
        }}
      />
      <Box sx={{ flexBasis: 260, flexShrink: 0, minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 600 }} variant="body2">
          {described.title}
        </Typography>
        <Typography noWrap sx={{ color: "text.secondary" }} variant="caption">
          {described.kindLabel} · {described.subtitle}
        </Typography>
      </Box>
      <Typography
        noWrap
        sx={{
          color: "text.secondary",
          display: { xs: "none", md: "block" },
          flexGrow: 1,
          minWidth: 0,
        }}
        variant="body2"
      >
        {described.description ?? ""}
      </Typography>
      <Box sx={{ alignItems: "center", display: "flex", flexShrink: 0, gap: 1, ml: "auto" }}>
        {versions.length > 0 ? (
          <TextField
            select
            disabled={versions.length === 1}
            size="small"
            sx={{ width: 110 }}
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {versions.map((version) => (
              <MenuItem key={version.id} value={version.id}>
                {version.label}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Box sx={{ width: 110 }} />
        )}
        <Tooltip title={counted.description}>
          <Box
            aria-label={counted.description}
            component={A}
            href={counted.href}
            sx={{
              alignItems: "baseline",
              color: "text.primary",
              display: "flex",
              gap: 0.5,
              textDecoration: "none",
              width: 74,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {counted.number ?? (
                <CountMark status={counted.count.status as "pending" | "unreadable"} />
              )}
            </Typography>
            <Typography sx={{ color: "text.secondary" }} variant="caption">
              {counted.number === "1" ? "run" : "runs"}
            </Typography>
          </Box>
        </Tooltip>
        <Button
          component={A}
          href={projectLinks.runDefinition(projectId, item.definitionType, definitionId, runState)}
          size="small"
          startIcon={<PlayArrowIcon />}
          variant="outlined"
        >
          Run
        </Button>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------------------------

const executionsFor = (item: RunDefinitionItem, run: ProjectRunCatalogue): RunExecutions =>
  item.kind === "workflow" ? run.executions.runningWorkflows : run.executions.instances;

const grid = (children: ReactNode) => (
  <Box
    sx={{
      display: "grid",
      gap: 2,
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      "@container run-page (max-width: 800px)": {
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      },
    }}
  >
    {children}
  </Box>
);

export interface RunCatalogueVariantProps {
  items: readonly RunDefinitionItem[];
  projectId: string;
  run: ProjectRunCatalogue;
  runState: RunState;
}

export const RunCatalogueVariantA = ({
  items,
  projectId,
  run,
  runState,
}: RunCatalogueVariantProps) =>
  grid(
    items.map((item) => (
      <VariantACard
        executions={executionsFor(item, run)}
        item={item}
        key={`${item.definitionType}-${item.id}`}
        projectId={projectId}
        runState={runState}
      />
    )),
  );

export const RunCatalogueVariantB = ({
  items,
  projectId,
  run,
  runState,
}: RunCatalogueVariantProps) =>
  grid(
    items.map((item) => (
      <VariantBCard
        executions={executionsFor(item, run)}
        item={item}
        key={`${item.definitionType}-${item.id}`}
        projectId={projectId}
        runState={runState}
      />
    )),
  );

export const RunCatalogueVariantD = ({
  items,
  projectId,
  run,
  runState,
}: RunCatalogueVariantProps) =>
  grid(
    items.map((item) => (
      <VariantDCard
        executions={executionsFor(item, run)}
        item={item}
        key={`${item.definitionType}-${item.id}`}
        projectId={projectId}
        runState={runState}
      />
    )),
  );

export const RunCatalogueVariantC = ({
  items,
  projectId,
  run,
  runState,
}: RunCatalogueVariantProps) => (
  <Paper variant="outlined">
    <Stack divider={<Divider flexItem />}>
      {items.map((item) => (
        <VariantCRow
          executions={executionsFor(item, run)}
          item={item}
          key={`${item.definitionType}-${item.id}`}
          projectId={projectId}
          runState={runState}
        />
      ))}
    </Stack>
  </Paper>
);
