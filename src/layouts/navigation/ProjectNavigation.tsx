import { type ReactNode } from "react";

import { Box, Skeleton, Stack } from "@mui/material";
import { useRouter } from "next/router";

import { FilesIcon, ManageIcon, ResultsIcon, RunIcon } from "../../components/icons";
import { ProjectSelector } from "../../projects/ProjectSelector";
import { projectSectionHref, projectSections } from "../../projects/routes";
import { useRouteProjectId } from "../../projects/useRouteProject";
import { NavigationTab } from "./NavigationTab";

const sectionIcons = {
  files: <FilesIcon />,
  manage: <ManageIcon />,
  results: <ResultsIcon />,
  run: <RunIcon />,
} as const;

/** The strip's frame: the project selector beside the section tabs. */
const ProjectStrip = ({ selector, tabs }: { selector: ReactNode; tabs: ReactNode }) => (
  <Stack
    direction={{ xs: "column", md: "row" }}
    // The strip sits inside the application bar but is not part of it: it keeps the page's own
    // surface and text colour rather than inheriting the bar's.
    sx={{
      alignItems: { md: "center" },
      bgcolor: "background.paper",
      borderBottom: 1,
      borderColor: "divider",
      color: "text.primary",
      px: 2,
    }}
  >
    <Box sx={{ minWidth: 260, py: 0.5 }}>{selector}</Box>
    <Stack
      aria-label="Project"
      component="nav"
      direction="row"
      sx={{ ml: { md: "auto" }, overflowX: "auto" }}
    >
      {tabs}
    </Stack>
  </Stack>
);

/**
 * The strip before it can name its project: the route is read only once the router is ready, and
 * the masthead only shows the strip once the session has answered. The page's own path is known on
 * the first render, server included, so a project page holds the strip's place from the start.
 */
export const ProjectNavigationPlaceholder = () =>
  useRouter().pathname.startsWith("/projects/[projectId]") ? (
    <ProjectStrip
      selector={<Skeleton height={50} variant="rounded" />}
      tabs={projectSections.map(({ key }) => (
        // A tab's own height: a medium button over its three-pixel indicator.
        <Skeleton height={39.5} key={key} sx={{ mx: 0.5 }} variant="rounded" width={88} />
      ))}
    />
  ) : null;

export const ProjectNavigation = () => {
  const router = useRouter();
  const projectId = useRouteProjectId();

  if (!projectId) {
    return <ProjectNavigationPlaceholder />;
  }

  return (
    <ProjectStrip
      selector={<ProjectSelector projectId={projectId} />}
      tabs={projectSections.map(({ key, label }) => {
        const href = projectSectionHref(key, projectId);
        return (
          <NavigationTab
            active={router.asPath.startsWith(href)}
            href={href}
            icon={sectionIcons[key]}
            key={key}
            label={label}
          />
        );
      })}
    />
  );
};
