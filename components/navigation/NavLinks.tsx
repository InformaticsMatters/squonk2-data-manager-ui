import { forwardRef } from 'react';

import type { ButtonProps } from '@mui/material';
import { Button, styled } from '@mui/material';

import { useIsUserAProjectOwnerOrEditor } from '../../hooks/projectHooks';
import { NavLink } from './NavLink';

export interface NavLinksProps {
  /**
   * Maximum width of the link in pixels
   */
  linkWidth?: number;
}

export const NavLinks = ({ linkWidth = 120 }: NavLinksProps) => {
  const isEditorOrOwner = useIsUserAProjectOwnerOrEditor();

  return (
    <Nav linkWidth={linkWidth}>
      {/* Div wrappers used to give correct spacing */}
      <div>
        <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Datasets">
          {({ active }) => <NavButton active={active}>Datasets</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Project">
          {({ active }) => <NavButton active={active}>Project</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Executions">
          {({ active }) => (
            <NavButton active={active} disabled={!isEditorOrOwner}>
              Executions
            </NavButton>
          )}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Results">
          {({ active }) => (
            <NavButton active={active} disabled={!isEditorOrOwner}>
              Results
            </NavButton>
          )}
        </NavLink>
      </div>
    </Nav>
  );
};

type NavButtonProps = ButtonProps & { active: boolean };

const NavButton = forwardRef<any, NavButtonProps>(({ active, ...props }, ref) => (
  <Button
    ref={ref}
    variant="text"
    {...props}
    sx={{
      fontWeight: active ? 'bold' : 'normal',
      color: 'white',
      textTransform: 'none',
      ':hover': {
        bgcolor: 'rgba(50, 0, 0, 0.04)',
      },
    }}
  />
));

const Nav = styled('nav', { shouldForwardProp: (prop) => prop !== 'linkWidth' })<{
  linkWidth: number;
}>(({ linkWidth }) => ({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',

  '& div': {
    display: 'inline-block',
    width: '100%',
    maxWidth: `${linkWidth}px`,
    textAlign: 'center',
  },
  '& div:first-of-type': { marginLeft: theme.spacing(8) },
}));
