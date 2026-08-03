import { Box, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { ProjectIdentity } from "../../projects/ProjectIdentity";
import { projectLinks } from "../../projects/routes";
import { useRouteProject } from "../../projects/useRouteProject";
import { NavigationTab } from "./NavigationTab";

const projectSections = [
  { key: "files", label: "Files" },
  { key: "run", label: "Run" },
  { key: "results", label: "Results" },
  { key: "manage", label: "Manage" },
] as const;

export const ProjectNavigation = () => {
  const router = useRouter();
  const { project, projectId } = useRouteProject();

  if (!projectId) {
    return null;
  }

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      sx={{ alignItems: { md: "center" }, borderBottom: 1, borderColor: "divider", px: 2 }}
    >
      <Box sx={{ minWidth: 260, py: 1 }}>
        <Typography sx={{ fontWeight: 850 }}>{project?.name ?? "Project"}</Typography>
        <ProjectIdentity
          organisationId={project?.organisation_id}
          unitId={project?.unit_id ?? projectId}
        />
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
