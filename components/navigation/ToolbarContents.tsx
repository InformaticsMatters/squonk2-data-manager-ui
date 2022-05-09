import { styled, useMediaQuery, useTheme } from '@mui/material';

import { useIsAuthorized } from '../../hooks/useIsAuthorized';
import { MobileNavMenu } from './MobileNavMenu';
import { NavLinks } from './NavLinks';
import { OUPContext } from './OUPContext';
import { UserMenu } from './UserMenu';

/**
 * Desktop / Tablet toolbar contents
 */
export const ToolbarContents = () => {
  const theme = useTheme();
  // Custom breakpoint to match width of nav links text
  const biggerThanSm = useMediaQuery('@media (min-width:655px)');
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
          <MobileNavMenu />
        </IconsWrapper>
      </>
    );
  }

  return <MobileNavMenu />;
};

const IconsWrapper = styled('div')({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  flex: '1 0',
  minWidth: 0,
});
