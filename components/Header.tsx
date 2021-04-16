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
            & a {
              display: inline-block;
              min-width: 120px;
              cursor: ;
            }

            & a:first-of-type {
              margin-left: ${theme.spacing(8)}px;
            }
          `}
        >
          <NavLink title="Data" />
          <NavLink title="Tasks" />
          <NavLink title="Executions Manager" />
        </nav>
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
