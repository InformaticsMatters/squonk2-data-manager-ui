import { Container, Grid, Link, List, ListItem, Paper, Typography } from "@mui/material";
import NextLink from "next/link";

import { AppVersions } from "../components/AppVersions";

export const Footer = () => {
  return (
    <Paper square component="footer" sx={{ marginTop: "auto" }}>
      <Container maxWidth="md">
        <Grid container p={2}>
          <Grid item sm={6} xs={12}>
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
          </Grid>
          <Grid item sm={3} textAlign="right" xs={12}>
            <List dense>
              <ListItem sx={{ justifyContent: "right" }}>
                <NextLink passHref href={{ pathname: "/" }}>
                  <Link>Home</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={{ justifyContent: "right" }}>
                <NextLink passHref href={{ pathname: "/datasets" }}>
                  <Link>Datasets</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={{ justifyContent: "right" }}>
                <NextLink passHref href={{ pathname: "/datasets" }}>
                  <Link>Project</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={{ justifyContent: "right" }}>
                <NextLink passHref href={{ pathname: "/datasets" }}>
                  <Link>Executions</Link>
                </NextLink>
              </ListItem>
            </List>
          </Grid>
          <Grid item sm={3} xs={12}>
            <List>
              <ListItem sx={{ justifyContent: "right" }}>
                <NextLink passHref href={{ pathname: "/datasets" }}>
                  <Link>Results</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={{ justifyContent: "right" }}>
                <NextLink passHref href={{ pathname: "/products" }}>
                  <Link>Products</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={{ justifyContent: "right" }}>
                <NextLink passHref href={{ pathname: "/docs/guided-tour" }}>
                  <Link>Docs</Link>
                </NextLink>
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  );
};
