import { type ReactNode, useState } from "react";

import {
  History as HistoryIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import A from "next/link";

import { definitionKindInk, definitionKinds } from "../../constants/definitionKinds";
import { projectLinks, type RunState } from "../../projects/routes";
import {
  countRunDefinitionExecutions,
  runDefinitionExecutionFilter,
  type RunDefinitionItem,
  type RunDefinitionSelection,
  runExecutionCountStatement,
  type RunExecutions,
} from "../../projects/runFacts";

/** One version of a job, as the footer's version control offers it. */
interface VersionOption {
  id: string;
  label: string;
}

/**
 * One card's material, whichever kind of definition it is drawing. The card lays out this shape
 * rather than three, so a job, an application and a workflow present the same anatomy and a reader
 * meets the same arrangement on every card.
 */
interface DefinitionPresentation {
  /** The identity the Run control's canonical route carries — for a job, the selected version's. */
  definitionId: string;
  description?: ReactNode;
  /** Documentation published for the definition, where it has any. */
  docUrl?: string;
  keywords: readonly string[];
  /** The card's `Label: value` lines, in the order they are stated. */
  meta: readonly { label: string; value: string }[];
  /** What the card is currently offering, which is what its execution count counts. */
  selection: RunDefinitionSelection;
  /** Empty unless the definition is one the card offers a choice of versions of. */
  versions: readonly VersionOption[];
}

/**
 * What one catalogue entry puts on its card. A job's is decided by the version selected on the
 * card, so choosing another version moves the card's whole footer, count and Run destination
 * together.
 */
const describeDefinition = (
  item: RunDefinitionItem,
  selectedVersionId: string | undefined,
): DefinitionPresentation => {
  switch (item.kind) {
    case "application": {
      const application = item.data;
      return {
        definitionId: application.application_id,
        keywords: [],
        // The card's subtitle is already the application's group, so the card does not state it a
        // second time as a metadata line.
        meta: [],
        selection: { kind: "application", application },
        versions: [],
      };
    }
    case "job": {
      const job =
        item.data.find((candidate) => String(candidate.id) === selectedVersionId) ?? item.data[0];
      return {
        definitionId: String(job.id),
        description: job.description ?? undefined,
        docUrl: job.doc_url ?? undefined,
        keywords: job.keywords ?? [],
        meta: [
          { label: "Category", value: job.category ?? "No category" },
          { label: "Collection", value: job.collection },
        ],
        selection: { kind: "job", job },
        versions: item.data.map((version) => ({ id: String(version.id), label: version.version })),
      };
    }
    case "workflow": {
      const workflow = item.data;
      return {
        definitionId: workflow.id,
        description: workflow.workflow_description ?? <em>No description</em>,
        keywords: [],
        // A workflow definition has one version and nothing to choose between, so its version is
        // stated as a fact here rather than offered as a control that chooses nothing.
        meta: [{ label: "Version", value: workflow.version ?? "n/a" }],
        selection: { kind: "workflow", workflow },
        versions: [],
      };
    }
  }
};

/**
 * The version the card is offering, and the choice of the others where there is one. It is a menu
 * button rather than a select because the footer is a row of actions: the version is stated, and a
 * definition published in one version states it without a form field's furniture around it.
 */
const VersionMenuButton = ({
  onSelect,
  selectedVersionId,
  versions,
}: {
  onSelect: (id: string) => void;
  selectedVersionId: string;
  versions: readonly VersionOption[];
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const current = versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  const onlyVersion = versions.length === 1;

  return (
    <>
      <Button
        // The control is named for what it chooses rather than for the version it happens to be
        // offering, which is what the twenty other cards' version controls would otherwise all be
        // called. Which version that is, is the menu's to state: its options carry it, and the one
        // in force is marked as selected.
        aria-expanded={anchor !== null}
        aria-haspopup="menu"
        aria-label="Version"
        color="inherit"
        disabled={onlyVersion}
        endIcon={onlyVersion ? undefined : <KeyboardArrowDownIcon />}
        size="small"
        sx={{ minWidth: 0, textTransform: "none" }}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {current.label}
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {versions.map((version) => (
          <MenuItem
            key={version.id}
            selected={version.id === selectedVersionId}
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

export interface DefinitionCardProps {
  /**
   * The collection this definition's executions are counted from, exactly as its own read left it.
   * A card is given only the collection it counts, so a slow or failed read of the other one never
   * decides what this card's count may say.
   */
  executions: RunExecutions;
  item: RunDefinitionItem;
  projectId: string;
  /** The catalogue state the definition route preserves, so Close and Back restore it exactly. */
  runState: RunState;
}

/**
 * One definition of the project in the URL, as the Run catalogue offers it.
 *
 * The card states what kind of definition it is in words and how many times it has run before any
 * of its detail is read, keeps every fact a caller chooses a definition by, and ends in a footer
 * divided from that content: the version it is offering on the left, the control that runs it on
 * the right, and nothing between them. The content grows, so the footer sits on the card's own
 * bottom edge and the footers of a grid row line up however tall their cards had to be.
 *
 * It shares no implementation with the result cards. A definition card and a result card want
 * different anatomy, and one component serving both is what forced this footer's controls into a
 * row that could not hold them.
 *
 * The card lists none of its executions itself: its count links to the one place that lists a
 * definition's executions properly. What running this definition requires is not stated here
 * either — the section states once what the project requires of every definition, and the modal the
 * Run control opens states what the version it addresses requires of its own accord.
 */
export const DefinitionCard = ({ executions, item, projectId, runState }: DefinitionCardProps) => {
  // Which version the card offers is ephemeral card state: the definition route it links to is
  // what makes a chosen version shareable.
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const { definitionId, description, docUrl, keywords, meta, selection, versions } =
    describeDefinition(item, selectedVersionId);
  const kind = definitionKinds[item.kind];

  // The count and the list it opens are built from one selection, so they can never name two
  // different definitions — and what the count displays is the facts module's to decide, so the
  // mark a caller reads and the statement a screen reader hears are one rule rather than two.
  const { filter, name, target } = runDefinitionExecutionFilter(selection);
  const count = runExecutionCountStatement(countRunDefinitionExecutions(executions, target), name);
  const runLabel = `Run ${item.title}`;

  return (
    <Card sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ backgroundColor: kind.accent, height: 4 }} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 1 }}>
          <Chip
            label={kind.label}
            size="small"
            sx={[
              { backgroundColor: alpha(kind.accent, 0.14), fontWeight: 700, letterSpacing: 0.3 },
              definitionKindInk(item.kind),
            ]}
          />
          <Tooltip title={count.description}>
            <Chip
              clickable
              aria-label={count.description}
              component={A}
              href={projectLinks.results(projectId, { definition: filter }) as never}
              icon={<HistoryIcon sx={{ fontSize: 15 }} />}
              label={count.text}
              size="small"
              sx={{ ml: "auto" }}
              variant="outlined"
            />
          </Tooltip>
        </Box>
        <Typography sx={{ fontWeight: 600, lineHeight: 1.3 }} variant="subtitle1">
          {item.title}
        </Typography>
        <Typography sx={{ color: "text.secondary", display: "block" }} variant="caption">
          {item.subtitle}
        </Typography>
        {/* The documentation link is the definition's own, so a definition that publishes
        documentation but no description still offers it rather than losing it with the paragraph it
        used to hang off. */}
        {(description !== undefined || docUrl !== undefined) && (
          <Typography sx={{ mt: 1, textWrap: "pretty" }} variant="body2">
            {description}
            {!!docUrl && (
              <Tooltip title="View documentation">
                <IconButton
                  // A link around an icon says nothing about where it goes, and a target smaller
                  // than a fingertip cannot be followed on the device most likely to meet it.
                  aria-label="View documentation"
                  href={docUrl}
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ height: 24, ml: 0.5, p: 0, verticalAlign: "middle", width: 24 }}
                  target="_blank"
                >
                  <LaunchIcon sx={{ fontSize: "0.875rem" }} />
                </IconButton>
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
        {keywords.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
            {keywords.map((word) => (
              <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </CardContent>
      <Divider />
      {/* The footer holds the version the card is offering and the control that runs it, and
      nothing else. A definition with no versions leaves the row to the Run control alone rather
      than rendering an empty element to push it right. */}
      <CardActions
        sx={{
          alignItems: "center",
          gap: 1,
          justifyContent: versions.length > 0 ? "space-between" : "flex-end",
          px: 2,
        }}
      >
        {/* Only a job offers a choice of versions, and the version it is offering is the identity
        its own definition route carries, so the two are one value rather than two that could
        disagree. */}
        {versions.length > 0 && (
          <VersionMenuButton
            selectedVersionId={definitionId}
            versions={versions}
            onSelect={setSelectedVersionId}
          />
        )}
        <Tooltip title={runLabel}>
          <Button
            // A page of identical Run controls is only navigable if each names the definition it
            // runs.
            aria-label={runLabel}
            component={A}
            href={projectLinks.runDefinition(
              projectId,
              item.definitionType,
              definitionId,
              runState,
            )}
            size="small"
            variant="contained"
          >
            Run
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
};
