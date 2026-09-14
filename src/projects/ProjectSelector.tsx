import { useMemo, useState } from "react";

import { useGetUnits } from "@/api/account-server/unit";
import { useGetProjects } from "@/api/data-manager/project";

import { KeyboardArrowDownRounded } from "@mui/icons-material";
import { Box, ButtonBase } from "@mui/material";
import { useRouter } from "next/router";

import { SearchMenu, type SearchMenuSection } from "../components/SearchMenu";
import { useSelectedOrganisation, useVisibleOrganisations } from "../state/organisationSelection";
import { ProjectHeading } from "./ProjectHeading";
import { ProjectIdentity } from "./ProjectIdentity";
import {
  buildProjectSelectorList,
  projectSelectorReach,
  type ProjectSelectorScope,
} from "./projectIndex";
import { readRecentProjectIds } from "./recentProjects";
import { projectSectionHref, projectSectionLabel, routeProjectSection } from "./routes";

/**
 * The project identity in the strip, as a way into any other project the caller can reach.
 *
 * Choosing a project is a **navigation**, never a selection. Every row is a real link to the target
 * project's canonical route, so the URL stays the single source of which project is displayed
 * (ADR-0001), the page renders only once the new route has resolved and authorised, and nothing
 * here holds a project. That is what distinguishes this control from the selected scope #1914
 * removed: it changes the address bar and then gets out of the way.
 *
 * The popover, its keyboard and its accessibility semantics are the shared search menu, which the
 * organisation switcher in the masthead directly above is also built on, so the two controls in the
 * chrome cannot answer the keyboard differently. What is left here is what only this control knows:
 * which projects exist, how they are grouped, and what choosing one does.
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
 * The list holds the organisation in effect, as the Projects index does, so the two cannot
 * disagree about which projects exist. `projectSelectorReach` is the whole of the other answer —
 * every organisation the caller can reach, narrowed by search rather than by a scope control — and
 * nothing offers to change it. That answer is kept because entering a project already adopts its
 * owning organisation, so crossing between them costs this control nothing; what scoping costs is
 * a project the caller can reach and can no longer see.
 */
export const ProjectSelector = ({ projectId }: { projectId: string }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recentProjectIds, setRecentProjectIds] = useState<readonly string[]>([]);
  // Nothing this control needs is worth a read on every project page: the list is read when the
  // caller asks for it, and TanStack keeps it for every open after the first.
  const { data: projects, isPending: projectsArePending } = useGetProjects(undefined, {
    query: { enabled: open },
  });
  const { data: units, isPending: unitsArePending } = useGetUnits(undefined, {
    query: { enabled: open },
  });
  const organisations = useVisibleOrganisations({ enabled: open });
  const organisationId = useSelectedOrganisation()[2];
  // The ancestry has to have answered as well as the projects: a row read before it arrives names
  // the identifier its container declares rather than that container's name, and search would then
  // be matching identifiers the caller has never seen.
  const listIsPending = projectsArePending || unitsArePending;
  const section = routeProjectSection(router.asPath, projectId);
  const sectionLabel = projectSectionLabel(section);

  // Nothing to scope to is not the same as a scope of nothing: until an organisation is in effect
  // the list spans them all, because a strip whose only job is offering a way out must not be
  // empty while the identity settles.
  const scope = useMemo<ProjectSelectorScope>(
    () =>
      projectSelectorReach === "organisation" && organisationId
        ? { kind: "organisation", organisationId }
        : { kind: "every-organisation" },
    [organisationId],
  );
  const sections = useMemo<SearchMenuSection[]>(
    () =>
      buildProjectSelectorList(
        projects?.projects ?? [],
        { organisations, units: units ?? { units: [] } },
        { recentProjectIds, scope, search, urlProjectId: projectId },
      ).sections.map(({ heading, rows }) => ({
        heading,
        rows: rows.map((row) => ({
          href: projectSectionHref(section, row.projectId),
          id: row.projectId,
          primary: row.projectName,
          secondary: (
            <ProjectIdentity organisationLabel={row.organisationName} unitLabel={row.unitName} />
          ),
        })),
      })),
    [organisations, projectId, projects, recentProjectIds, scope, search, section, units],
  );

  return (
    <SearchMenu
      ariaLabel="Change project"
      currentHint="The project in the address bar"
      currentId={projectId}
      emptyLabel={(term) =>
        term ? `No project matches “${term}”.` : "No projects are available to open."
      }
      footerNote={`Opens ${sectionLabel}`}
      isPending={listIsPending}
      listLabel="Projects"
      pendingLabel="Loading projects…"
      renderTrigger={(bind) => (
        <ButtonBase
          {...bind}
          sx={{
            borderRadius: 1,
            gap: 1,
            px: 1,
            py: 0.5,
            textAlign: "left",
            width: "100%",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Box component="span" sx={{ display: "block", flexGrow: 1, minWidth: 0 }}>
            <ProjectHeading projectId={projectId} />
          </Box>
          <KeyboardArrowDownRounded fontSize="small" sx={{ color: "text.secondary" }} />
        </ButtonBase>
      )}
      search={search}
      searchLabel="Search projects"
      searchPlaceholder="Project, unit or organisation"
      sections={sections}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        // Read when the menu opens rather than live, so the order does not move under the caller
        // while they are looking at it.
        if (nextOpen) {
          setRecentProjectIds(readRecentProjectIds(localStorage));
        }
      }}
      onSearchChange={setSearch}
      onSelect={({ href }) => {
        // The row's own link, rather than the same route built a second time: what the pointer
        // would have followed and what the keyboard opens cannot then be two different answers.
        if (href) {
          void router.push(href as never);
        }
      }}
    />
  );
};
