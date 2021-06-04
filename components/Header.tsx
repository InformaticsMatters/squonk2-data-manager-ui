import React from 'react';

import { useUser } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { AppBar, Toolbar, useTheme } from '@material-ui/core';

import { Logo } from './navigation/Logo';
import { NavLink } from './navigation/NavLink';
import { UserMenu } from './navigation/UserMenu';
import { ProjectManager } from './ProjectManager/ProjectManager';

const Header: React.FC = () => {
  const theme = useTheme();

  const { user } = useUser();

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
          <NavLink title="Executions" />
          {/* <NavLink title="Tasks" /> */}
        </nav>
        <div
          css={css`
            display: flex;
            margin-left: auto;
          `}
        >
          {user && <ProjectManager inverted />}
          <UserMenu />
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
