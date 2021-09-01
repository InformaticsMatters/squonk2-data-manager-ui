import React, { forwardRef } from 'react';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { ButtonProps } from '@material-ui/core';
import { Button as MuiButton, useTheme } from '@material-ui/core';
import { useRouter } from 'next/router';

import { NavLink } from './NavLink';

export interface NavLinksProps {
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
      <div>
        <NavLink
          stripQueryParameters={
            router.pathname === '/data' ? ['pid', 'project', 'path'] : ['pid', 'path']
          }
          title="Data"
        >
          {({ active }) => <NavButton $active={active}>Data</NavButton>}
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

// N.B. using the transient props pattern here
// https://medium.com/@probablyup/introducing-transient-props-f35fd5203e0c
const Button = forwardRef<any, ButtonProps & { $active: boolean }>(({ $active, ...props }, ref) => (
  <MuiButton ref={ref} {...props} />
));

const NavButton = styled(Button)`
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  color: white;
  text-decoration: none;
  text-transform: none;
`;
