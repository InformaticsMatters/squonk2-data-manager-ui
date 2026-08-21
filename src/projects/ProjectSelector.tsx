import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import { useGetUnits } from "@/api/account-server/unit";
import { useGetProjects } from "@/api/data-manager/project";

import { CheckRounded, KeyboardArrowDownRounded, SearchRounded } from "@mui/icons-material";
import {
  Box,
  ButtonBase,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { useVisibleOrganisations } from "../state/organisationSelection";
import { ProjectHeading } from "./ProjectHeading";
import { ProjectIdentity } from "./ProjectIdentity";
import { buildProjectSelectorList, type ProjectSelectorRow } from "./projectIndex";
import { readRecentProjectIds } from "./recentProjects";
import { projectSectionHref, projectSectionLabel, routeProjectSection } from "./routes";

const listboxId = "project-selector-listbox";
const optionId = (index: number) => `project-selector-option-${index}`;

/**
 * The project identity in the strip, as a way into any other project the caller can reach.
 *
 * Choosing a project is a **navigation**, never a selection. Every row is a real link to the target
 * project's canonical route, so the URL stays the single source of which project is displayed
 * (ADR-0001), the page renders only once the new route has resolved and authorised, and nothing
 * here holds a project. That is what distinguishes this control from the selected scope #1914
 * removed: it changes the address bar and then gets out of the way.
 *
 * Two deliberate deviations from #1914, recorded so neither is later reverted as a spec violation:
 *
 * 1. A chosen project opens **the section the caller is standing in**, not Files. Story 13 governs
 *    entering a project from outside it; this control is used from inside one, where keeping the
 *    section is the entire point. The footer says which section it will open, so the rule is
 *    stated rather than discovered, and there is no modifier for the other behaviour.
 * 2. Story 16 forbids scope swapped underneath an open page, which is a selected-project value
 *    rather than a control. See above: there is no such value here.
 *
 * The list spans every organisation the caller can reach, with no scope control. Filtering it to
 * the organisation in effect would hide projects with no control left to reveal them; search
 * matching on organisation name does the same job without a mode. Entering a project already
 * adopts its owning organisation, so crossing between them is ordinary.
 */
export const ProjectSelector = ({ projectId }: { projectId: string }) => {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentProjectIds, setRecentProjectIds] = useState<readonly string[]>([]);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const open = !!anchor;
  // Nothing this control needs is worth a read on every project page: the list is read when the
  // caller asks for it, and TanStack keeps it for every open after the first.
  const { data: projects, isPending: projectsArePending } = useGetProjects(undefined, {
    query: { enabled: open },
  });
  const { data: units, isPending: unitsArePending } = useGetUnits(undefined, {
    query: { enabled: open },
  });
  const organisations = useVisibleOrganisations({ enabled: open });
  // The ancestry has to have answered as well as the projects: a row read before it arrives names
  // the identifier its container declares rather than that container's name, and search would then
  // be matching identifiers the caller has never seen.
  const listIsPending = projectsArePending || unitsArePending;
  const section = routeProjectSection(router.asPath, projectId);
  const sectionLabel = projectSectionLabel(section);

  const list = useMemo(
    () =>
      buildProjectSelectorList(
        projects?.projects ?? [],
        { organisations, units: units ?? { units: [] } },
        recentProjectIds,
        projectId,
        search,
      ),
    [organisations, projectId, projects, recentProjectIds, search, units],
  );

  // Read when the menu opens rather than live, so the order does not move under the caller while
  // they are looking at it.
  useEffect(() => {
    if (open) {
      setRecentProjectIds(readRecentProjectIds(localStorage));
    }
  }, [open]);
  // The highlight starts at the top of whatever the list has just become, so Enter always opens
  // the row the caller can see is highlighted.
  useEffect(() => setActiveIndex(0), [search]);
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const close = () => {
    setAnchor(null);
    // The search text describes no page and can be sent to nobody, so it is discarded rather than
    // kept: reopening the menu starts clean.
    setSearch("");
  };

  const openProject = (row: ProjectSelectorRow | undefined) => {
    if (!row) {
      return;
    }
    close();
    void router.push(projectSectionHref(section, row.projectId) as never);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const last = Math.max(list.rows.length - 1, 0);
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, last));
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      }
      case "End": {
        event.preventDefault();
        setActiveIndex(last);
        break;
      }
      case "Enter": {
        event.preventDefault();
        openProject(list.rows[activeIndex]);
        break;
      }
      case "Home": {
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case "Tab": {
        // Tab leaves rather than walking the list. The rows are not tab stops, so the menu closes
        // and hands the keyboard back to the identity it opened from, where the next Tab moves on.
        event.preventDefault();
        close();
        break;
      }
      // No default
    }
  };

  // A modifier click opens the project in a new tab and leaves this one where it was, so the menu
  // stays open: the caller is still standing here and may well want another.
  const closeUnlessOpeningElsewhere = (event: MouseEvent) => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      close();
    }
  };

  const renderRow = (row: ProjectSelectorRow, index: number) => (
    <ListItemButton
      disableRipple
      // The highlight is where the keyboard is; the check is where the caller already is. The two
      // meanings must never share one appearance.
      aria-selected={index === activeIndex}
      component={Link}
      data-index={index}
      href={projectSectionHref(section, row.projectId) as never}
      id={optionId(index)}
      key={row.projectId}
      role="option"
      selected={index === activeIndex}
      // Not a tab stop: focus stays in the search box for the life of the menu, which is what lets
      // typing and arrowing interleave and stops Tab from walking a hundred rows to leave.
      tabIndex={-1}
      {...(row.isUrlProject ? { "aria-current": true } : {})}
      onClick={closeUnlessOpeningElsewhere}
      onMouseMove={() => setActiveIndex(index)}
    >
      <ListItemText
        primary={row.projectName}
        secondary={
          <ProjectIdentity organisationLabel={row.organisationName} unitLabel={row.unitName} />
        }
        slotProps={{ primary: { sx: { fontWeight: 700 } } }}
      />
      {row.isUrlProject ? (
        <CheckRounded
          color="primary"
          fontSize="small"
          titleAccess="The project in the address bar"
        />
      ) : null}
    </ListItemButton>
  );

  return (
    <>
      <ButtonBase
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Change project"
        sx={{
          borderRadius: 1,
          gap: 1,
          px: 1,
          py: 0.5,
          textAlign: "left",
          width: "100%",
          "&:hover": { bgcolor: "action.hover" },
        }}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <Box component="span" sx={{ display: "block", flexGrow: 1, minWidth: 0 }}>
          <ProjectHeading projectId={projectId} />
        </Box>
        <KeyboardArrowDownRounded fontSize="small" sx={{ color: "text.secondary" }} />
      </ButtonBase>
      <Popover
        anchorEl={anchor}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        open={open}
        slotProps={{
          paper: { sx: { maxWidth: "100vw", mt: 0.5, width: 420 } },
          // The field's own autofocus races the modal's focus handling. The end of the entry
          // transition is the point at which the input certainly exists and nothing else is about
          // to claim focus, so the keyboard is live from the moment the menu has opened.
          transition: {
            onEntered: () => {
              setActiveIndex(0);
              searchRef.current?.focus();
            },
          },
        }}
        onClose={close}
      >
        {/* Keys are answered here rather than on the field alone, so the menu keeps answering the
            keyboard wherever focus has ended up inside it. */}
        <Box aria-label="Change project" role="dialog" onKeyDown={handleKeyDown}>
          <Box sx={{ p: 1.5, pb: 1 }}>
            <TextField
              fullWidth
              inputRef={searchRef}
              placeholder="Project, unit or organisation"
              size="small"
              slotProps={{
                htmlInput: {
                  "aria-activedescendant": list.rows.length > 0 ? optionId(activeIndex) : undefined,
                  "aria-autocomplete": "list",
                  "aria-controls": listboxId,
                  "aria-expanded": true,
                  "aria-label": "Search projects",
                  role: "combobox",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Box>
          <Box
            aria-label="Projects"
            id={listboxId}
            ref={listRef}
            role="listbox"
            // Relative to the viewport rather than a fixed height: a long list uses the screen it
            // has, and a short one leaves no hole.
            sx={{ maxHeight: "min(60vh, 420px)", overflowY: "auto" }}
          >
            {listIsPending ? (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                Loading projects…
              </Typography>
            ) : null}
            {!listIsPending && list.rows.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                {search ? `No project matches “${search}”.` : "No projects are available to open."}
              </Typography>
            ) : null}
            {list.sections.map(({ heading, rows, startIndex }) => (
              <List dense disablePadding key={heading} role="presentation">
                <ListSubheader role="presentation">{heading}</ListSubheader>
                {rows.map((row, index) => renderRow(row, startIndex + index))}
              </List>
            ))}
          </Box>
          <Divider />
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 2,
              justifyContent: "space-between",
              px: 1.5,
              py: 0.75,
            }}
          >
            <Stack direction="row" sx={{ gap: 1.5 }}>
              <Typography color="text.secondary" variant="caption">
                ↑↓ move
              </Typography>
              <Typography color="text.secondary" variant="caption">
                ↵ open
              </Typography>
            </Stack>
            <Typography color="text.secondary" variant="caption">
              Opens {sectionLabel}
            </Typography>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};
