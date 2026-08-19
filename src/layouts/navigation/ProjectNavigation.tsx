import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { useRouter } from "next/router";

import { ProjectIdentity } from "../../projects/ProjectIdentity";
import { routeProjectResolutionAtom } from "../../projects/routeProjectResolution";
import { projectLinks } from "../../projects/routes";
import { useRouteProjectId } from "../../projects/useRouteProject";
import { NavigationTab } from "./NavigationTab";

const projectSections = [
  { key: "files", label: "Files" },
  { key: "run", label: "Run" },
  { key: "results", label: "Results" },
  { key: "manage", label: "Manage" },
] as const;

/**
 * The name and identity of the project in the URL, or an honest account of why neither is there.
 *
 * The strip is mounted in the chrome, above the boundary that resolves the project, so it renders
 * before the project does. A placeholder says the project is on its way; the unavailable wording is
 * kept for a project that failed to arrive, so loading and failure stay distinguishable.
 */
const ProjectHeading = ({ projectId }: { projectId: string }) => {
  const published = useAtomValue(routeProjectResolutionAtom);
  const resolution = published?.projectId === projectId ? published : undefined;

  if (resolution?.status === "resolved") {
    const { organisation, project, unit } = resolution.workspace;
    return (
      <>
        <Typography sx={{ fontWeight: 850 }}>{project.name}</Typography>
        <ProjectIdentity organisationLabel={organisation.name} unitLabel={unit.name} />
      </>
    );
  }
  if (resolution?.status === "failed") {
    return (
      <>
        <Typography sx={{ fontWeight: 850 }}>Project unavailable</Typography>
        <ProjectIdentity />
      </>
    );
  }
  return (
    <Box aria-label="Loading project" role="status">
      <Skeleton sx={{ fontWeight: 850 }} variant="text" width={180} />
      <Skeleton sx={{ fontSize: 12 }} variant="text" width={120} />
    </Box>
  );
};

export const ProjectNavigation = () => {
  const router = useRouter();
  const projectId = useRouteProjectId();

  if (!projectId) {
    return null;
  }

  return (
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
      <Box sx={{ minWidth: 260, py: 1 }}>
        <ProjectHeading projectId={projectId} />
      </Box>
      <Stack
        aria-label="Project"
        component="nav"
        direction="row"
        sx={{ ml: { md: "auto" }, overflowX: "auto" }}
      >
        {projectSections.map(({ key, label }) => {
          const href = projectLinks[key](projectId);
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
    </Stack>
  );
};
