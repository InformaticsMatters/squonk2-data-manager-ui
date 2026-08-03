import { useDeferredValue, useEffect, useState } from "react";

import { useGetUnitsSuspense } from "@/api/account-server/unit";
import { useGetProjectsSuspense } from "@/api/data-manager/project";

import {
  Alert,
  Button,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { useFamilyRoute } from "../../application/FamilyRouteBoundary";
import Layout from "../../layouts/Layout";
import { ProjectIdentity } from "../../projects/ProjectIdentity";
import { buildProjectIndexItems } from "../../projects/projectIndex";
import { projectLinks } from "../../projects/routes";
import { useSelectedOrganisation } from "../../state/organisationSelection";

export const ProjectsIndex = () => {
  const router = useRouter();
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;
  const routeSearch = route?.kind === "index" ? route.search : undefined;
  const [search, setSearch] = useState(routeSearch ?? "");
  const deferredSearch = useDeferredValue(search);
  const selectedOrganisation = useSelectedOrganisation();
  const organisationId = selectedOrganisation[2];
  const { data: projects } = useGetProjectsSuspense();
  const { data: units } = useGetUnitsSuspense();

  useEffect(() => setSearch(routeSearch ?? ""), [routeSearch]);

  const items = organisationId
    ? buildProjectIndexItems(projects.projects, units, organisationId, deferredSearch)
    : [];

  const updateSearch = (value: string) => {
    setSearch(value);
    void router.replace(projectLinks.index({ search: value || undefined }) as never, undefined, {
      shallow: true,
    });
  };

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ alignItems: { sm: "flex-end" }, gap: 2, justifyContent: "space-between", mb: 3 }}
        >
          <div>
            <Typography component="h1" variant="h3">
              Projects
            </Typography>
            <Typography color="text.secondary">
              Choose a project before project resources are displayed.
            </Typography>
          </div>
          <Button component={Link} href={projectLinks.create()} variant="contained">
            Create project
          </Button>
        </Stack>
        <TextField
          fullWidth
          label="Search projects"
          placeholder="Project or containing unit"
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
        />
        {items.length > 0 ? (
          <List sx={{ mt: 2 }}>
            {items.map(({ organisationName, project, unitName }) => (
              <ListItemButton
                component={Link}
                href={projectLinks.files(project.project_id) as never}
                key={project.project_id}
              >
                <ListItemText
                  primary={project.name}
                  secondary={
                    <ProjectIdentity organisationLabel={organisationName} unitLabel={unitName} />
                  }
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            {search
              ? "No projects match this search in the current organisation."
              : "No projects are available in the current organisation."}
          </Alert>
        )}
      </Container>
    </Layout>
  );
};
