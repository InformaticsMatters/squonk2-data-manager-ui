import type { FC } from 'react';
import React from 'react';

import { Box } from '@material-ui/core';

import Header from './Header';

const Layout: FC = ({ children }) => {
  return (
    <>
      <Header />
      <Box component="main" marginY={2}>
        {children}
      </Box>
    </>
  );
};

export default Layout;
