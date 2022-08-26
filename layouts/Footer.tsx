import { Box, Container, Link, Paper, Typography } from "@mui/material";

import { AppVersions } from "../components/AppVersions";

export const Footer = () => {
  return (
    <Paper square component="footer" sx={{ marginTop: "auto" }}>
      <Container maxWidth="md">
        <Box p={2}>
          <Typography variant="h4">
            <strong style={{ fontFamily: "Raleway" }}>
              <Link href="https://squonk.it/" rel="noopener noreferrer" target="_blank">
                Squonk
              </Link>
            </strong>{" "}
            Data Manager
          </Typography>
          <Typography variant="subtitle1">
            A product by{" "}
            <Link
              href="https://www.informaticsmatters.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <strong>Informatics Matters</strong>
            </Link>
          </Typography>
          <AppVersions />
        </Box>
      </Container>
    </Paper>
  );
};
