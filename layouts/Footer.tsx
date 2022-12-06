import type { Theme } from "@mui/material";
import {
  Container,
  Grid,
  Link,
  List,
  ListItem,
  Paper,
  Typography,
  useMediaQuery,
} from "@mui/material";
import NextLink from "next/link";

import { AppVersions } from "../components/AppVersions";

export const Footer = () => {
  const small = useMediaQuery<Theme>((theme) => theme.breakpoints.up("sm"));
  const itemStyles = { justifyContent: small ? "right" : "left" };

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
          <Grid item sm={3} textAlign="right" xs={6}>
            <List dense sx={{ p: 0 }}>
              <ListItem sx={itemStyles}>
                <NextLink legacyBehavior passHref href={{ pathname: "/" }}>
                  <Link>Home</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={itemStyles}>
                <NextLink legacyBehavior passHref href={{ pathname: "/datasets" }}>
                  <Link>Datasets</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={itemStyles}>
                <NextLink legacyBehavior passHref href={{ pathname: "/project" }}>
                  <Link>Project</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={itemStyles}>
                <NextLink legacyBehavior passHref href={{ pathname: "/executions" }}>
                  <Link>Executions</Link>
                </NextLink>
              </ListItem>
            </List>
          </Grid>
          <Grid item sm={3} xs={6}>
            <List dense sx={{ p: 0 }}>
              <ListItem sx={itemStyles}>
                <NextLink legacyBehavior passHref href={{ pathname: "/results" }}>
                  <Link>Results</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={itemStyles}>
                <NextLink legacyBehavior passHref href={{ pathname: "/products" }}>
                  <Link>Products</Link>
                </NextLink>
              </ListItem>
              <ListItem sx={itemStyles}>
                <NextLink legacyBehavior passHref href={{ pathname: "/docs/guided-tour" }}>
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
