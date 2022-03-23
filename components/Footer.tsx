import { css } from '@emotion/react';
import { Box, Container, Link, Paper, Typography } from '@material-ui/core';

export const Footer = () => {
  return (
    <Paper square component="footer">
      <Container maxWidth="md">
        <Box p={2}>
          <Typography variant="h4">
            <strong
              css={css`
                font-family: Raleway;
              `}
            >
              Squonk
            </strong>{' '}
            Data Manager —{' '}
            <Link href="https://discourse.squonk.it/c/squonk-data-manager-knowledge-base/">
              Docs
            </Link>
          </Typography>
          <Typography variant="subtitle1">
            A product by{' '}
            <Link href="https://www.informaticsmatters.com/">
              <strong>Informatics Matters</strong>
            </Link>
          </Typography>
          <Typography variant="body2">Version: {process.env.NEXT_PUBLIC_APP_VERSION}</Typography>
        </Box>
      </Container>
    </Paper>
  );
};
