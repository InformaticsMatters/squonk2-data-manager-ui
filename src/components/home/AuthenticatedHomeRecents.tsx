import { useEffect, useState } from "react";

import { useGetProjects } from "@/api/data-manager/project";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { authClient } from "../../lib/auth-client";
import { ProjectIdentity } from "../../projects/ProjectIdentity";
import { readRecentProjectIds } from "../../projects/recentProjects";
import { projectLinks } from "../../projects/routes";

export const AuthenticatedHomeRecents = () => {
  const { data: session } = authClient.useSession();
  const { data } = useGetProjects(undefined, { query: { enabled: !!session } });
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => setRecentIds(readRecentProjectIds(localStorage)), []);

  const projects = recentIds
    .map((id) => data?.projects.find((project) => project.project_id === id))
    .filter((project) => project !== undefined);

  if (!session || projects.length === 0) {
    return null;
  }

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography component="h2" sx={{ fontWeight: 850 }} variant="h5">
        Recent projects
      </Typography>
      <Typography color="text.secondary">
        Continue from a direct link. Home itself has no active project scope.
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
        {projects.map((project) => (
          <Paper key={project.project_id} sx={{ flex: 1, p: 2 }} variant="outlined">
            <Typography sx={{ fontWeight: 800 }}>{project.name}</Typography>
            <ProjectIdentity organisationId={project.organisation_id} unitId={project.unit_id} />
            <Button component={Link} href={projectLinks.files(project.project_id)} sx={{ mt: 1 }}>
              Open files
            </Button>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};
