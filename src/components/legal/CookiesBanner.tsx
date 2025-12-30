import { Box, Button, Container, Grid, Link } from "@mui/material";

import { useCookieConsent } from "../../state/cookieConsent";

export const CookiesBanner = () => {
  const [consent, setConsent] = useCookieConsent();

  const handleConsent = () => {
    setConsent(true);
  };

  if (consent) {
    return null;
  }

  return (
    <Box
      sx={{
        // color: "white",
        bgcolor: "background.paper",
        position: "fixed",
        bottom: 0,
        right: 0,
        left: 0,
        padding: "0.5rem",
        boxShadow: 10,
        displayPrint: "none",
      }}
    >
      <Container>
        <Grid container sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 10 }}>
            Squonk Data Manager uses cookies for authentication. Some anonymous usage data is
            collected by <Link href="https://sentry.io/">Sentry</Link> to improve how this site
            functions.
          </Grid>
          <Grid>
            <Button variant="contained" onClick={handleConsent}>
              I understand
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
