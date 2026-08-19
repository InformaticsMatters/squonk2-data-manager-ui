import { useEffect, useState } from "react";

import { useGetUnits } from "@/api/account-server/unit";
import { useGetProjects } from "@/api/data-manager/project";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { authClient } from "../../lib/auth-client";
import { ProjectIdentity } from "../../projects/ProjectIdentity";
import { readRecentProjectIds } from "../../projects/recentProjects";
import { projectLinks } from "../../projects/routes";
import { useVisibleOrganisations } from "../../state/organisationSelection";

export const AuthenticatedHomeRecents = () => {
  const { data: session } = authClient.useSession();
  const { data } = useGetProjects(undefined, { query: { enabled: !!session } });
  const organisations = useVisibleOrganisations({ enabled: !!session });
  const { data: units } = useGetUnits(undefined, { query: { enabled: !!session } });
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => setRecentIds(readRecentProjectIds(localStorage)), [data, session?.user.id]);

  const projects = recentIds
    .map((id) => data?.projects.find((project) => project.project_id === id))
    .filter((project) => project !== undefined);
  // The default organisation is in this list too, so a project in the caller's personal unit is
  // named rather than falling back to the raw identifier it declares.
  const organisationNames = new Map(
    organisations.map((organisation) => [organisation.id, organisation.name]),
  );
  const unitNames = new Map(
    units?.units.flatMap((group) => group.units.map((unit) => [unit.id, unit.name] as const)),
  );

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
            <ProjectIdentity
              organisationLabel={
                organisationNames.get(project.organisation_id ?? "") ?? project.organisation_id
              }
              unitLabel={unitNames.get(project.unit_id ?? "") ?? project.unit_id}
            />
            <Button component={Link} href={projectLinks.files(project.project_id)} sx={{ mt: 1 }}>
              Open files
            </Button>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};
