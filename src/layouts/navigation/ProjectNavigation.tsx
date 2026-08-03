import { useGetProject } from "@/api/data-manager/project";

import { Box, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { projectLinks } from "../../projects/routes";
import { NavigationTab } from "./NavigationTab";

const projectSections = [
  { key: "files", label: "Files" },
  { key: "run", label: "Run" },
  { key: "results", label: "Results" },
  { key: "manage", label: "Manage" },
] as const;

export const ProjectNavigation = () => {
  const router = useRouter();
  const projectId = typeof router.query.projectId === "string" ? router.query.projectId : undefined;
  const { data: project } = useGetProject(projectId ?? "", { query: { enabled: !!projectId } });

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
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
          {project?.unit_id ?? projectId} · {project?.organisation_id ?? ""}
        </Typography>
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
