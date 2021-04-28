import React from 'react';

import { css } from '@emotion/react';
import { AppBar, Toolbar, useTheme } from '@material-ui/core';

import { Logo } from './navigation/Logo';
import { NavLink } from './navigation/NavLink';
import { UserMenu } from './navigation/UserMenu';

const Header: React.FC = () => {
  const theme = useTheme();

  return (
    <AppBar position="static">
      <Toolbar>
        <Logo />

        <nav
          css={css`
            display: flex;
            align-items: center;

            & a {
              display: inline-block;
              width: 100px;
              text-align: center;
            }

            & a:first-of-type {
              margin-left: ${theme.spacing(8)}px;
            }
          `}
        >
          <NavLink title="Data" />
          <NavLink title="Execution Manager" />
          <NavLink title="Tasks" />
        </nav>
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
