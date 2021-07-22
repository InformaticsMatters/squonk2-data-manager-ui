import type { FC } from 'react';
import React from 'react';

import Header from './Header';

const Layout: FC = ({ children }) => {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
};

export default Layout;
