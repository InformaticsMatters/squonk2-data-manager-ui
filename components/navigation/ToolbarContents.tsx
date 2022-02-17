import styled from '@emotion/styled';
import { useMediaQuery, useTheme } from '@material-ui/core';
import dynamic from 'next/dynamic';

import { useIsAuthorized } from '../../hooks/useIsAuthorized';
import { CenterLoader } from '../CenterLoader';
import type { ProjectManagerProps } from '../ProjectManager';
import { MobileNavMenu } from './MobileNavMenu';
import { NavLinks } from './NavLinks';
import { ProjectModalButton } from './ProjectModalButton';
import { UserMenu } from './UserMenu';

const ProjectManager = dynamic<ProjectManagerProps>(
  () => import('../ProjectManager').then((mod) => mod.ProjectManager),
  {
    loading: () => <CenterLoader />,
  },
);

/**
 * Desktop / Tablet toolbar contents
 */
export const ToolbarContents = () => {
  const theme = useTheme();
  const biggerThanSm = useMediaQuery(theme.breakpoints.up('sm'));
  const biggerThanMd = useMediaQuery(theme.breakpoints.up('md'));

  const isAuthorized = useIsAuthorized();

  if (biggerThanMd) {
    // Desktop
    return (
      <>
        <NavLinks linkWidth={120} />
        <IconsWrapper>
          {isAuthorized && <ProjectManager inverted />}
          <UserMenu />
        </IconsWrapper>
      </>
    );
  } else if (biggerThanSm) {
    // Tablet
    return (
      <>
        <NavLinks linkWidth={100} />
        <IconsWrapper>
          <ProjectModalButton />
          <UserMenu />
        </IconsWrapper>
      </>
    );
  }

  return <MobileNavMenu />;
};

const IconsWrapper = styled.div`
  display: flex;
  margin-left: auto;
  align-items: center;
`;
