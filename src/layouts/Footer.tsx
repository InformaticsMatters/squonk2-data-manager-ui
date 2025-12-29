import { Container, Grid, Link, List, ListItem, Paper, Typography } from "@mui/material";
import A from "next/link";

import { AppVersions } from "../components/AppVersions";
import { ralewayFont } from "../constants/fonts";

export const Footer = () => {
  const itemStyles = { justifyContent: { xs: "left", sm: "right" } };

  return (
    <Paper square component="footer" sx={{ marginTop: "auto", displayPrint: "none" }}>
      <Container maxWidth="md">
        <Grid container sx={{ p: 2 }}>
          <Grid size={{ sm: 6, xs: 12 }}>
            <Typography variant="h4">
              <strong style={{ fontFamily: ralewayFont.style.fontFamily }}>
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
          </Grid>
          <Grid size={{ sm: 3, xs: 6 }} sx={{ textAlign: "right" }}>
            <List dense sx={{ p: 0 }}>
              <ListItem sx={itemStyles}>
                <Link component={A} href={{ pathname: "/" }}>
                  Home
                </Link>
              </ListItem>
              <ListItem sx={itemStyles}>
                <Link component={A} href={{ pathname: "/datasets" }}>
                  Datasets
                </Link>
              </ListItem>
              <ListItem sx={itemStyles}>
                <Link component={A} href={{ pathname: "/project" }}>
                  Project
                </Link>
              </ListItem>
              <ListItem sx={itemStyles}>
                <Link component={A} href={{ pathname: "/run" }}>
                  Apps/Jobs
                </Link>
              </ListItem>
            </List>
          </Grid>
          <Grid size={{ sm: 3, xs: 6 }}>
            <List dense sx={{ p: 0 }}>
              <ListItem sx={itemStyles}>
                <Link component={A} href={{ pathname: "/results" }}>
                  Results
                </Link>
              </ListItem>
              <ListItem sx={itemStyles}>
                <Link component={A} href={{ pathname: "/products" }}>
                  Products
                </Link>
              </ListItem>
              <ListItem sx={itemStyles}>
                <Link component={A} href={{ pathname: "/docs/guided-tour" }}>
                  Docs
                </Link>
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  );
};
