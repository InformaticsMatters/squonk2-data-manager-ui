import { forwardRef } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { ButtonProps } from '@material-ui/core';
import { Button as MuiButton, useTheme } from '@material-ui/core';

import { useIsUserAProjectOwnerOrEditor } from '../../hooks/projectHooks';
import { NavLink } from './NavLink';

export interface NavLinksProps {
  /**
   * Maximum width of the link in pixels
   */
  linkWidth?: number;
}

export const NavLinks = ({ linkWidth }: NavLinksProps) => {
  const theme = useTheme();

  const isEditorOrOwner = useIsUserAProjectOwnerOrEditor();

  return (
    <nav
      css={css`
        flex: 1;
        display: flex;
        align-items: center;

        & div {
          display: inline-block;
          width: 100%;
          max-width: ${linkWidth}px;
          text-align: center;
        }

        & div:first-of-type {
          margin-left: ${theme.spacing(8)}px;
        }

        & div > a.MuiButton-root.Mui-disabled {
          color: rgba(100, 0, 0, 0.3);
        }
      `}
    >
      {/* Div wrappers used to give correct spacing */}
      <div>
        <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Datasets">
          {({ active }) => <NavButton $active={active}>Datasets</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Project">
          {({ active }) => <NavButton $active={active}>Project</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Executions">
          {({ active }) => (
            <NavButton $active={active} disabled={!isEditorOrOwner}>
              Executions
            </NavButton>
          )}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Results">
          {({ active }) => (
            <NavButton $active={active} disabled={!isEditorOrOwner}>
              Results
            </NavButton>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

// N.B. using the transient props pattern
// https://medium.com/@probablyup/introducing-transient-props-f35fd5203e0c
const Button = forwardRef<any, ButtonProps & { $active: boolean }>(
  ({ $active: _$active, ...props }, ref) => <MuiButton ref={ref} {...props} />,
);

const NavButton = styled(Button)`
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  color: white;
  text-decoration: none;
  text-transform: none;
`;
