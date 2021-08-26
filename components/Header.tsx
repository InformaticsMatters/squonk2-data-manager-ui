import type { FC } from 'react';
import React from 'react';

import { css } from '@emotion/react';
import { AppBar, Toolbar, useTheme } from '@material-ui/core';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { useIsAuthorized } from '../hooks/useIsAuthorized';
import { Logo } from './navigation/Logo';
import { NavLink } from './navigation/NavLink';
import { UserMenu } from './navigation/UserMenu';
import type { ProjectManagerProps } from './ProjectManager/ProjectManager';
import { CenterLoader } from './CenterLoader';

const ProjectManager = dynamic<ProjectManagerProps>(
  () => import('./ProjectManager/ProjectManager').then((mod) => mod.ProjectManager),
  {
    loading: () => <CenterLoader />,
  },
);

const Header: FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const isAuthorized = useIsAuthorized();

  return (
    <AppBar position="static">
      <Toolbar>
        <Logo />

        <nav
          css={css`
            display: flex;
            align-items: center;

            & div {
              display: inline-block;
              width: 120px;
              text-align: center;
            }

            & div:first-of-type {
              margin-left: ${theme.spacing(8)}px;
            }
          `}
        >
          <div>
            <NavLink
              stripQueryParameters={
                router.pathname === '/data' ? ['pid', 'project', 'path'] : ['pid', 'path']
              }
              title="Data"
            />
          </div>
          <div>
            <NavLink stripQueryParameters={['pid', 'path']} title="Executions" />
          </div>
          <div>
            <NavLink stripQueryParameters={['pid', 'path']} title="Tasks" />
          </div>
        </nav>
        <div
          css={css`
            display: flex;
            margin-left: auto;
          `}
        >
          {isAuthorized && <ProjectManager inverted />}
          <UserMenu />
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
