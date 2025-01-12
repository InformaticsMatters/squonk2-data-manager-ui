import {
  Container,
  Grid2 as Grid,
  Link,
  List,
  ListItem,
  Paper,
  type Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import A from "next/link";

import { AppVersions } from "../components/AppVersions";
import { ralewayFont } from "../constants/fonts";

export const Footer = () => {
  const small = useMediaQuery((theme: Theme) => theme.breakpoints.up("sm"));
  const itemStyles = { justifyContent: small ? "right" : "left" };

  return (
    <Paper square component="footer" sx={{ marginTop: "auto" }}>
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
                <A legacyBehavior passHref href={{ pathname: "/" }}>
                  <Link>Home</Link>
                </A>
              </ListItem>
              <ListItem sx={itemStyles}>
                <A legacyBehavior passHref href={{ pathname: "/datasets" }}>
                  <Link>Datasets</Link>
                </A>
              </ListItem>
              <ListItem sx={itemStyles}>
                <A legacyBehavior passHref href={{ pathname: "/project" }}>
                  <Link>Project</Link>
                </A>
              </ListItem>
              <ListItem sx={itemStyles}>
                <A legacyBehavior passHref href={{ pathname: "/run" }}>
                  <Link>Apps/Jobs</Link>
                </A>
              </ListItem>
            </List>
          </Grid>
          <Grid size={{ sm: 3, xs: 6 }}>
            <List dense sx={{ p: 0 }}>
              <ListItem sx={itemStyles}>
                <A legacyBehavior passHref href={{ pathname: "/results" }}>
                  <Link>Results</Link>
                </A>
              </ListItem>
              <ListItem sx={itemStyles}>
                <A legacyBehavior passHref href={{ pathname: "/products" }}>
                  <Link>Products</Link>
                </A>
              </ListItem>
              <ListItem sx={itemStyles}>
                <A legacyBehavior passHref href={{ pathname: "/docs/guided-tour" }}>
                  <Link>Docs</Link>
                </A>
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  );
};
