import { Box, Skeleton, Typography } from "@mui/material";

import { resolvedAncestry } from "./projectAncestry";
import { ProjectIdentity } from "./ProjectIdentity";
import { useRouteProjectResolution } from "./routeProjectResolution";

/**
 * The name and identity of the project in the URL, or an honest account of why neither is there.
 *
 * The identity strip that renders this is part of the chrome, mounted above the boundary that
 * resolves the project, so it renders before the project does. A placeholder says the project is on
 * its way; the unavailable wording is kept for a project that failed to arrive, so loading and
 * failure stay distinguishable.
 *
 * Every element here is phrasing content, because the strip renders this inside the button that
 * opens the project selector — the strip offers a way out of a project in all three of its states,
 * including the two where there is no project to name.
 */
export const ProjectHeading = ({ projectId }: { projectId: string }) => {
  const resolution = useRouteProjectResolution(projectId);

  if (resolution?.status === "resolved") {
    const { ancestry, project } = resolution.workspace;
    const resolved = resolvedAncestry(ancestry);
    return (
      <>
        <Typography component="span" sx={{ display: "block", fontWeight: 850 }}>
          {project.name}
        </Typography>
        {/* A project whose ancestry could not be read is named without one, rather than being
            called unavailable: the project itself arrived, and only its unit and organisation are
            missing from what the strip can say about it. */}
        <ProjectIdentity
          organisationLabel={resolved?.organisation.name}
          unitLabel={resolved?.unit.name}
        />
      </>
    );
  }
  if (resolution?.status === "failed") {
    return (
      <>
        <Typography component="span" sx={{ display: "block", fontWeight: 850 }}>
          Project unavailable
        </Typography>
        <ProjectIdentity />
      </>
    );
  }
  return (
    <Box aria-label="Loading project" component="span" role="status" sx={{ display: "block" }}>
      <Skeleton sx={{ fontWeight: 850 }} variant="text" width={180} />
      <Skeleton sx={{ fontSize: 12 }} variant="text" width={120} />
    </Box>
  );
};
