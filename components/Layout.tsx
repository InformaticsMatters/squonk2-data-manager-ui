import type { FC } from 'react';

import { Box, LinearProgress, Slide } from '@mui/material';

import { useIsTransitioning } from '../hooks/useIsTransitioning';
import { Footer } from './Footer';
import Header from './Header';

const Layout: FC = ({ children }) => {
  const isTransitioning = useIsTransitioning(true);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      {isTransitioning && <LinearProgress />}
      <Slide appear direction="right" in={!isTransitioning}>
        <Box component="main" paddingY={2}>
          {children}
        </Box>
      </Slide>
      <Footer />
    </Box>
  );
};

export default Layout;
