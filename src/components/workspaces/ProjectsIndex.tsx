import { useGetProjects } from "@/api/data-manager/project";

import { Button, Container, List, ListItemButton, ListItemText, Typography } from "@mui/material";

import Layout from "../../layouts/Layout";
import { ProjectIdentity } from "../../projects/ProjectIdentity";
import { projectLinks } from "../../projects/routes";

export const ProjectsIndex = () => {
  const { data } = useGetProjects();

  return (
    <Layout>
      <Container>
        <Typography component="h1" variant="h4">
          Projects
        </Typography>
        <Typography color="text.secondary">
          Choose a project before project resources are displayed.
        </Typography>
        <List>
          {(data?.projects ?? []).map((project) => (
            <ListItemButton
              component="a"
              href={projectLinks.files(project.project_id)}
              key={project.project_id}
            >
              <ListItemText
                primary={project.name}
                secondary={
                  <ProjectIdentity
                    organisationId={project.organisation_id}
                    unitId={project.unit_id}
                  />
                }
              />
            </ListItemButton>
          ))}
        </List>
        <Button href={projectLinks.create()} variant="contained">
          Create project
        </Button>
      </Container>
    </Layout>
  );
};
