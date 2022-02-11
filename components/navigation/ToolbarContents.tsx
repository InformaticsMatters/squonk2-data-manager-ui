import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useMediaQuery, useTheme } from '@material-ui/core';

import { useIsAuthorized } from '../../hooks/useIsAuthorized';
import { MobileNavMenu } from './MobileNavMenu';
import { NavLinks } from './NavLinks';
import { OUPContext } from './OUPContext';
import { ProjectModalButton } from './ProjectModalButton';
import { UserMenu } from './UserMenu';

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
          {isAuthorized && <OUPContext />}
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
          <div
            css={css`
              margin: ${theme.spacing()}px;
            `}
          >
            <ProjectModalButton />
          </div>
          <UserMenu />
        </IconsWrapper>
      </>
    );
  }

  return <MobileNavMenu />;
};

const IconsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex: 1 0;
  min-width: 0;
`;
