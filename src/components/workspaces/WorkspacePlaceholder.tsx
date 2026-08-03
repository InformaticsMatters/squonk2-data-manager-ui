import { Container, Typography } from "@mui/material";

import Layout from "../../layouts/Layout";

export const WorkspacePlaceholder = ({ title }: { title: string }) => (
  <Layout>
    <Container>
      <Typography component="h1" variant="h4">
        {title}
      </Typography>
    </Container>
  </Layout>
);
