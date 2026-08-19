import { Box, Stack } from "@mui/material";
import { useRouter } from "next/router";

import { ProjectHeading } from "../../projects/ProjectHeading";
import { projectLinks } from "../../projects/routes";
import { useRouteProjectId } from "../../projects/useRouteProject";
import { NavigationTab } from "./NavigationTab";

const projectSections = [
  { key: "files", label: "Files" },
  { key: "run", label: "Run" },
  { key: "results", label: "Results" },
  { key: "manage", label: "Manage" },
] as const;

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
