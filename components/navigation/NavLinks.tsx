import { forwardRef } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { ButtonProps } from '@material-ui/core';
import { Button as MuiButton, useTheme } from '@material-ui/core';
import { useRouter } from 'next/router';

import { NavLink } from './NavLink';

export interface NavLinksProps {
  /**
   * Maximum width of the link in pixels
   */
  linkWidth?: number;
}

export const NavLinks = ({ linkWidth }: NavLinksProps) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <nav
      css={css`
        width: 100%;
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
      `}
    >
      {/* Div wrappers used to give correct spacing */}
      <div>
        <NavLink stripQueryParameters={['pid', 'path']} title="Datasets">
          {({ active }) => <NavButton $active={active}>Datasets</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['pid', 'path']} title="Project">
          {({ active }) => <NavButton $active={active}>Project</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['pid', 'path']} title="Executions">
          {({ active }) => <NavButton $active={active}>Executions</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={['pid', 'path']} title="Tasks">
          {({ active }) => <NavButton $active={active}>Tasks</NavButton>}
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
