import { Box, Skeleton, Typography } from "@mui/material";

import { ProjectIdentity } from "./ProjectIdentity";
import { useRouteProjectResolution } from "./routeProjectResolution";

/**
 * The name and identity of the project in the URL, or an honest account of why neither is there.
 *
 * The identity strip that renders this is part of the chrome, mounted above the boundary that
 * resolves the project, so it renders before the project does. A placeholder says the project is on
 * its way; the unavailable wording is kept for a project that failed to arrive, so loading and
 * failure stay distinguishable.
 */
export const ProjectHeading = ({ projectId }: { projectId: string }) => {
  const resolution = useRouteProjectResolution(projectId);

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
