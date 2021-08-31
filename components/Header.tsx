import type { FC } from 'react';
import React from 'react';

import { AppBar, Toolbar } from '@material-ui/core';

import { Logo } from './navigation/Logo';
import { ToolbarContents } from './navigation/ToolbarContents';

const Header: FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Logo />

        <ToolbarContents />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
