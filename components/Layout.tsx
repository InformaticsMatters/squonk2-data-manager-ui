import type { FC } from 'react';

import { Box } from '@mui/material';

import { Footer } from './Footer';
import Header from './Header';

const Layout: FC = ({ children }) => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box component="main" paddingY={2}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
