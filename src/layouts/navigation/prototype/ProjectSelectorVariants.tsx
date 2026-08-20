/**
 * PROTOTYPE — throwaway. Four answers to issue #1979: what should the project sub-navigation's
 * identity look like once it becomes a project selector?
 *
 * Every variant is a *navigation* control, never a selected-project value: each row is a real href
 * to the target project's URL, so the page renders only after the new route resolves and
 * authorises, and the URL stays the single source of what is displayed (ADR-0001, story 16).
 *
 * The variants deliberately disagree about the four decisions the issue leaves open — which
 * section the new project opens in, whether other organisations are listed, how an unavailable
 * project reads, and where search lives — so the disagreements can be seen rather than argued.
 */
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import {
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Collapse,
  Dialog,
  Divider,
  FormControlLabel,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Paper,
  Popover,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { ProjectIdentity } from "../../../projects/ProjectIdentity";
import { readRecentProjectIds } from "../../../projects/recentProjects";
import { useRouteProjectResolution } from "../../../projects/routeProjectResolution";
import { projectLinks } from "../../../projects/routes";
import { NavigationTab } from "../NavigationTab";
import {
  currentSection,
  matchesSearch,
  projectSections,
  sectionHref,
  type SelectorProject,
  useSelectorProjects,
} from "./projectSelectorData";

interface VariantProps {
  projectId: string;
}

/** The section tabs, identical in every variant — the variants disagree about the identity, not this. */
const SectionTabs = ({ projectId, sx }: VariantProps & { sx?: object }) => {
  const router = useRouter();
  return (
    <Stack
      aria-label="Project"
      component="nav"
      direction="row"
      sx={{ ml: { md: "auto" }, overflowX: "auto", ...sx }}
    >
      {projectSections.map(({ key, label }) => {
        const href = sectionHref(key, projectId);
        return (
          <NavigationTab
            active={router.asPath.startsWith(href)}
            href={href}
            key={key}
            label={label}
          />
        );
      })}
    </Stack>
  );
};

const Strip = ({ children }: { children: ReactNode }) => (
  <Stack
    direction={{ xs: "column", md: "row" }}
    sx={{
      alignItems: { md: "center" },
      bgcolor: "background.paper",
      borderBottom: 1,
      borderColor: "divider",
      color: "text.primary",
      px: 2,
    }}
  >
    {children}
  </Stack>
);

/** What the strip knows about the project in the URL, in the three states it can be in. */
const useProjectLabel = (projectId: string) => {
  const resolution = useRouteProjectResolution(projectId);
  if (resolution?.status === "resolved") {
    const { organisation, project, unit } = resolution.workspace;
    return {
      state: "resolved" as const,
      name: project.name,
      organisationId: organisation.id,
      organisationName: organisation.name,
      unitName: unit.name,
    };
  }
  return {
    state: resolution?.status === "failed" ? ("failed" as const) : ("pending" as const),
    name: resolution?.status === "failed" ? "Project unavailable" : "",
    organisationId: undefined,
    organisationName: undefined,
    unitName: undefined,
  };
};

const useRecentProjects = (open: boolean) => {
  const [recentIds, setRecentIds] = useState<readonly string[]>([]);
  useEffect(() => {
    if (open) {
      setRecentIds(readRecentProjectIds(localStorage));
    }
  }, [open]);
  return recentIds;
};

const ProjectRowText = ({ project }: { project: SelectorProject }) => (
  <ListItemText
    primary={project.name}
    secondary={
      <ProjectIdentity organisationLabel={project.organisationName} unitLabel={project.unitName} />
    }
  />
);

/* ------------------------------------------------------------------ *
 * Variant A — Anchored dropdown
 *
 * The identity block itself becomes the button. Answers: preserve the section silently (and say
 * so in the footer); current organisation only, with an opt-in to the rest; search at the top of
 * the menu; an unavailable project still opens the menu, which is the way out of it.
 * ------------------------------------------------------------------ */
export const ProjectDropdownVariant = ({ projectId }: VariantProps) => {
  const router = useRouter();
  const label = useProjectLabel(projectId);
  const { items } = useSelectorProjects();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const [allOrganisations, setAllOrganisations] = useState(false);
  const recentIds = useRecentProjects(Boolean(anchorEl));
  const section = currentSection(router.asPath, projectId);
  const sectionLabel = projectSections.find(({ key }) => key === section)?.label ?? "Files";

  const inScope = items.filter(
    (project) =>
      allOrganisations ||
      label.organisationId === undefined ||
      project.organisationId === label.organisationId,
  );
  const matched = inScope.filter((project) => matchesSearch(project, search));
  const recent: SelectorProject[] = search
    ? []
    : recentIds
        .filter((id) => id !== projectId)
        .flatMap((id) => matched.filter((project) => project.projectId === id));
  const rest = matched.filter(
    (project) => !recent.some((entry) => entry.projectId === project.projectId),
  );

  const close = () => {
    setAnchorEl(null);
    setSearch("");
  };

  const row = (project: SelectorProject) => (
    <ListItemButton
      component={Link}
      href={sectionHref(section, project.projectId) as never}
      key={project.projectId}
      selected={project.projectId === projectId}
      onClick={close}
    >
      <ProjectRowText project={project} />
      {project.projectId === projectId ? <CheckIcon color="primary" fontSize="small" /> : null}
    </ListItemButton>
  );

  return (
    <Strip>
      <Box sx={{ minWidth: 260, py: 0.5 }}>
        <ButtonBase
          sx={{
            borderRadius: 1,
            px: 1,
            py: 0.5,
            textAlign: "left",
            width: "100%",
            "&:hover": { bgcolor: "action.hover" },
          }}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <Box sx={{ flexGrow: 1 }}>
            {label.state === "pending" ? (
              <>
                <Skeleton variant="text" width={180} />
                <Skeleton sx={{ fontSize: 12 }} variant="text" width={120} />
              </>
            ) : (
              <>
                <Typography sx={{ fontWeight: 850 }}>{label.name}</Typography>
                <ProjectIdentity
                  organisationLabel={label.organisationName}
                  unitLabel={label.unitName}
                />
              </>
            )}
          </Box>
          <KeyboardArrowDownIcon fontSize="small" sx={{ color: "text.secondary" }} />
        </ButtonBase>
      </Box>
      <SectionTabs projectId={projectId} />
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        open={Boolean(anchorEl)}
        slotProps={{ paper: { sx: { mt: 0.5, width: 380 } } }}
        onClose={close}
      >
        <Box sx={{ p: 1.5, pb: 1 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search projects"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Box>
        <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
          {matched.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No projects match this search.
            </Typography>
          ) : (
            <List dense disablePadding>
              {recent.length > 0 ? (
                <>
                  <ListSubheader>Recent</ListSubheader>
                  {recent.map((project) => row(project))}
                  <Divider />
                </>
              ) : null}
              {recent.length > 0 ? <ListSubheader>All projects</ListSubheader> : null}
              {rest.map((project) => row(project))}
            </List>
          )}
        </Box>
        <Divider />
        <Stack
          direction="row"
          sx={{ alignItems: "center", gap: 1, justifyContent: "space-between", px: 1.5, py: 0.5 }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={allOrganisations}
                size="small"
                onChange={(event) => setAllOrganisations(event.target.checked)}
              />
            }
            label={<Typography variant="caption">All organisations</Typography>}
          />
          <Typography color="text.secondary" variant="caption">
            Opens {sectionLabel}
          </Typography>
        </Stack>
      </Popover>
    </Strip>
  );
};

/* ------------------------------------------------------------------ *
 * Variant B — Command palette
 *
 * A compact pill in the strip; the choosing happens in a centred, keyboard-driven overlay.
 * Answers: every organisation, always, grouped by organisation; search *is* the control; Enter
 * opens Files (story 13) and Shift+Enter keeps the section, so both answers are in the hands;
 * an unavailable project reads as an empty pill inviting a choice.
 * ------------------------------------------------------------------ */
export const ProjectPaletteVariant = ({ projectId }: VariantProps) => {
  const router = useRouter();
  const label = useProjectLabel(projectId);
  const { items } = useSelectorProjects();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);
  const section = currentSection(router.asPath, projectId);
  const sectionLabel = projectSections.find(({ key }) => key === section)?.label ?? "Files";

  const matched = items.filter((project) => matchesSearch(project, search));
  const grouped = useMemo(() => {
    const groups = new Map<string, SelectorProject[]>();
    for (const project of matched) {
      groups.set(project.organisationName, [
        ...(groups.get(project.organisationName) ?? []),
        project,
      ]);
    }
    return [...groups.entries()].toSorted(([left], [right]) => left.localeCompare(right));
  }, [matched]);
  const ordered = grouped.flatMap(([, projects]) => projects);

  useEffect(() => setActive(0), [search]);
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (project: SelectorProject | undefined, keepSection: boolean) => {
    if (!project) {
      return;
    }
    setOpen(false);
    setSearch("");
    void router.push(sectionHref(keepSection ? section : "files", project.projectId) as never);
  };

  return (
    <Strip>
      <Box sx={{ minWidth: 260, py: 1 }}>
        <ButtonBase
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
            gap: 1,
            px: 1.5,
            py: 0.75,
            width: "100%",
            "&:hover": { borderColor: "text.secondary" },
          }}
          onClick={() => setOpen(true)}
        >
          <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: "left" }}>
            {label.state === "pending" ? (
              <Skeleton variant="text" width={160} />
            ) : (
              <>
                <Typography noWrap sx={{ fontWeight: 850 }}>
                  {label.name}
                </Typography>
                <ProjectIdentity
                  organisationLabel={label.organisationName}
                  unitLabel={label.unitName}
                />
              </>
            )}
          </Box>
          <Chip label="Switch" size="small" sx={{ height: 20, fontSize: 11 }} variant="outlined" />
        </ButtonBase>
      </Box>
      <SectionTabs projectId={projectId} />
      <Dialog
        fullWidth
        maxWidth="sm"
        open={open}
        slotProps={{
          paper: { sx: { alignSelf: "flex-start", mt: 10 } },
          transition: { onEntered: () => setActive(0) },
        }}
        onClose={() => setOpen(false)}
      >
        <TextField
          autoFocus
          fullWidth
          placeholder="Search every project you can reach"
          slotProps={{
            input: {
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { fontSize: 18, px: 2, py: 1.5 },
            },
          }}
          value={search}
          variant="standard"
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            switch (event.key) {
              case "ArrowDown": {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, ordered.length - 1));

                break;
              }
              case "ArrowUp": {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));

                break;
              }
              case "Enter": {
                event.preventDefault();
                go(ordered[active], event.shiftKey);

                break;
              }
              // No default
            }
          }}
        />
        <Divider />
        <Box sx={{ maxHeight: 400, minHeight: 200, overflowY: "auto" }}>
          {ordered.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
              Nothing matches “{search}”.
            </Typography>
          ) : (
            <List dense disablePadding ref={listRef}>
              {grouped.map(([organisationName, projects]) => (
                <Box component="li" key={organisationName} sx={{ listStyle: "none" }}>
                  <ListSubheader disableSticky>{organisationName}</ListSubheader>
                  <List dense disablePadding>
                    {projects.map((project) => {
                      const index = ordered.indexOf(project);
                      return (
                        <ListItemButton
                          data-index={index}
                          key={project.projectId}
                          selected={index === active}
                          onClick={(event) => go(project, event.shiftKey)}
                          onMouseEnter={() => setActive(index)}
                        >
                          <ListItemText
                            primary={project.name}
                            secondary={project.unitName}
                            sx={{ my: 0 }}
                          />
                          {project.projectId === projectId ? (
                            <Typography color="text.secondary" variant="caption">
                              current
                            </Typography>
                          ) : null}
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Box>
              ))}
            </List>
          )}
        </Box>
        <Divider />
        <Stack direction="row" sx={{ gap: 2, px: 2, py: 1 }}>
          <Typography color="text.secondary" variant="caption">
            ↑↓ move
          </Typography>
          <Typography color="text.secondary" variant="caption">
            ↵ open Files
          </Typography>
          <Typography color="text.secondary" variant="caption">
            ⇧↵ stay in {sectionLabel}
          </Typography>
        </Stack>
      </Dialog>
    </Strip>
  );
};

/* ------------------------------------------------------------------ *
 * Variant C — Breadcrumb cascade
 *
 * No single project control at all: the identity becomes a trail of three narrowing menus,
 * Organisation › Unit › Project. Answers: crossing organisations is the point of the first crumb;
 * search lives inside the project crumb only, because the first two crumbs have already narrowed
 * it; choosing a project always opens Files (story 13, unchanged); an unavailable project leaves
 * the first two crumbs unset and the trail still usable.
 * ------------------------------------------------------------------ */
const Crumb = ({
  children,
  disabled,
  label,
  value,
}: {
  children: (close: () => void) => ReactNode;
  disabled?: boolean;
  label: string;
  value: string;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        color="inherit"
        disabled={disabled}
        endIcon={<KeyboardArrowDownIcon />}
        size="small"
        sx={{ minWidth: 0, textTransform: "none" }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <Box sx={{ textAlign: "left" }}>
          <Typography component="span" sx={{ display: "block", fontSize: 10, opacity: 0.7 }}>
            {label}
          </Typography>
          <Typography noWrap component="span" sx={{ display: "block", fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
      </Button>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        open={Boolean(anchorEl)}
        slotProps={{ paper: { sx: { minWidth: 260, mt: 0.5 } } }}
        onClose={() => setAnchorEl(null)}
      >
        {children(() => setAnchorEl(null))}
      </Popover>
    </>
  );
};

export const ProjectBreadcrumbVariant = ({ projectId }: VariantProps) => {
  const label = useProjectLabel(projectId);
  const { items } = useSelectorProjects();
  const [organisationName, setOrganisationName] = useState<string | undefined>();
  const [unitName, setUnitName] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  // The trail follows the URL project until the caller starts steering it themselves.
  const organisation = organisationName ?? label.organisationName;
  const unit = unitName ?? label.unitName;

  const organisations = [...new Set(items.map((project) => project.organisationName))].toSorted(
    (left, right) => left.localeCompare(right),
  );
  const inOrganisation = items.filter((project) => project.organisationName === organisation);
  const units = [...new Set(inOrganisation.map((project) => project.unitName))].toSorted(
    (left, right) => left.localeCompare(right),
  );
  const projects = inOrganisation
    .filter((project) => unit === undefined || project.unitName === unit)
    .filter((project) => matchesSearch(project, search));

  return (
    <Strip>
      <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", py: 0.5 }}>
        <Crumb
          label="Organisation"
          value={organisation ?? (label.state === "failed" ? "—" : "Loading…")}
        >
          {(close) => (
            <List dense disablePadding>
              {organisations.map((name) => (
                <ListItemButton
                  key={name}
                  selected={name === organisation}
                  onClick={() => {
                    setOrganisationName(name);
                    setUnitName(undefined);
                    close();
                  }}
                >
                  <ListItemText primary={name} />
                </ListItemButton>
              ))}
            </List>
          )}
        </Crumb>
        <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled" }} />
        <Crumb
          disabled={organisation === undefined}
          label="Unit"
          value={unit ?? (label.state === "failed" ? "—" : "Loading…")}
        >
          {(close) => (
            <List dense disablePadding>
              {units.map((name) => (
                <ListItemButton
                  key={name}
                  selected={name === unit}
                  onClick={() => {
                    setUnitName(name);
                    close();
                  }}
                >
                  <ListItemText primary={name} />
                </ListItemButton>
              ))}
            </List>
          )}
        </Crumb>
        <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled" }} />
        <Crumb
          label="Project"
          value={label.state === "pending" ? "Loading…" : label.name || "Project unavailable"}
        >
          {(close) => (
            <>
              <Box sx={{ p: 1 }}>
                <TextField
                  autoFocus
                  fullWidth
                  placeholder="Search projects"
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Box>
              <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
                <List dense disablePadding>
                  {projects.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 2 }}>
                      No projects here.
                    </Typography>
                  ) : (
                    projects.map((project) => (
                      <ListItemButton
                        component={Link}
                        href={projectLinks.files(project.projectId) as never}
                        key={project.projectId}
                        selected={project.projectId === projectId}
                        onClick={() => {
                          setSearch("");
                          close();
                        }}
                      >
                        <ListItemText primary={project.name} />
                      </ListItemButton>
                    ))
                  )}
                </List>
              </Box>
              <Divider />
              <Typography
                color="text.secondary"
                sx={{ display: "block", px: 2, py: 0.75 }}
                variant="caption"
              >
                Opens the project at Files
              </Typography>
            </>
          )}
        </Crumb>
      </Stack>
      <SectionTabs projectId={projectId} />
    </Strip>
  );
};

/* ------------------------------------------------------------------ *
 * Variant D — Expanding switcher panel
 *
 * Not a popup: a full-width panel that pushes the page down, so switching project is a deliberate
 * detour rather than a menu you can fall into. Answers: the caller picks the section explicitly on
 * the card, so nothing has to be decided for them; organisations are chips across the top, current
 * one first; search filters the grid; an unavailable project opens the panel by itself, so the
 * strip is never a dead end.
 * ------------------------------------------------------------------ */
export const ProjectPanelVariant = ({ projectId }: VariantProps) => {
  const router = useRouter();
  const label = useProjectLabel(projectId);
  const { items } = useSelectorProjects();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [organisationName, setOrganisationName] = useState<string | undefined>();
  const recentIds = useRecentProjects(open);
  const section = currentSection(router.asPath, projectId);

  const organisation = organisationName ?? label.organisationName;
  const organisations = [...new Set(items.map((project) => project.organisationName))].toSorted(
    (left, right) => left.localeCompare(right),
  );
  const matched = items
    .filter((project) => organisation === undefined || project.organisationName === organisation)
    .filter((project) => matchesSearch(project, search));
  const recentFirst = matched.toSorted(
    (left, right) =>
      (recentIds.indexOf(right.projectId) + 1 ? 1 : 0) -
        (recentIds.indexOf(left.projectId) + 1 ? 1 : 0) || left.name.localeCompare(right.name),
  );

  return (
    <Box>
      <Strip>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, minWidth: 260, py: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            {label.state === "pending" ? (
              <>
                <Skeleton variant="text" width={160} />
                <Skeleton sx={{ fontSize: 12 }} variant="text" width={110} />
              </>
            ) : (
              <>
                <Typography noWrap sx={{ fontWeight: 850 }}>
                  {label.name}
                </Typography>
                <ProjectIdentity
                  organisationLabel={label.organisationName}
                  unitLabel={label.unitName}
                />
              </>
            )}
          </Box>
          <Button
            color="inherit"
            endIcon={open ? <CloseIcon /> : <KeyboardArrowDownIcon />}
            size="small"
            sx={{ flexShrink: 0, textTransform: "none" }}
            variant="outlined"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "Close" : "Switch"}
          </Button>
        </Stack>
        <SectionTabs projectId={projectId} />
      </Strip>
      <Collapse in={open}>
        <Paper square elevation={0} sx={{ borderBottom: 1, borderColor: "divider", p: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{ alignItems: { md: "center" }, gap: 2, mb: 2 }}
          >
            <TextField
              placeholder="Search projects"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 260 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {organisations.map((name) => (
                <Chip
                  color={name === organisation ? "primary" : "default"}
                  key={name}
                  label={name}
                  size="small"
                  variant={name === organisation ? "filled" : "outlined"}
                  onClick={() => setOrganisationName(name)}
                />
              ))}
            </Stack>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
            }}
          >
            {recentFirst.map((project) => (
              <Paper
                key={project.projectId}
                sx={{
                  borderColor: project.projectId === projectId ? "primary.main" : "divider",
                  borderStyle: "solid",
                  borderWidth: 1,
                  p: 1.5,
                }}
                variant="outlined"
              >
                <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
                  <Typography noWrap sx={{ fontWeight: 700 }}>
                    {project.name}
                  </Typography>
                  {recentIds.includes(project.projectId) ? (
                    <Chip label="recent" size="small" sx={{ height: 18, fontSize: 10 }} />
                  ) : null}
                </Stack>
                <ProjectIdentity
                  organisationLabel={project.organisationName}
                  unitLabel={project.unitName}
                />
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                  {projectSections.map(({ key, label: sectionName }) => (
                    <Button
                      component={Link}
                      href={sectionHref(key, project.projectId) as never}
                      key={key}
                      size="small"
                      sx={{ minWidth: 0, px: 1, textTransform: "none" }}
                      variant={key === section ? "outlined" : "text"}
                      onClick={() => setOpen(false)}
                    >
                      {sectionName}
                    </Button>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Box>
          {recentFirst.length === 0 ? (
            <Typography color="text.secondary">No projects match this search.</Typography>
          ) : null}
        </Paper>
      </Collapse>
    </Box>
  );
};
