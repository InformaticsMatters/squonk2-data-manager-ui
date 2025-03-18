import { type ForwardedRef, forwardRef } from "react";

import { Button, type ButtonProps, styled } from "@mui/material";

import { NavLink } from "./NavLink";

export interface NavLinksProps {
  /**
   * Maximum width of the link in pixels
   */
  linkWidth?: number;
}

export const NavLinks = ({ linkWidth = 120 }: NavLinksProps) => {
  return (
    <Nav aria-label="Main" linkWidth={linkWidth} role="navigation">
      {/* Div wrappers used to give correct spacing */}
      <div>
        <NavLink stripQueryParameters={["path", "instanceId"]} title="Datasets">
          {({ active }) => <NavButton active={active}>Datasets</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={["path", "instanceId"]} title="Project">
          {({ active }) => <NavButton active={active}>Project Data</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={["path", "instanceId"]} title="Run">
          {({ active }) => <NavButton active={active}>Apps/Jobs</NavButton>}
        </NavLink>
      </div>
      <div>
        <NavLink stripQueryParameters={["path", "instanceId"]} title="Results">
          {({ active }) => <NavButton active={active}>Results</NavButton>}
        </NavLink>
      </div>
    </Nav>
  );
};

type NavButtonProps = ButtonProps & { active: boolean };

const NavButtonComponent = (
  { active, ...props }: NavButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) => (
  <Button
    ref={ref}
    variant="text"
    {...props}
    sx={{
      fontWeight: active ? "bold" : "normal",
      color: "white",
      textTransform: "none",
      ":hover": { bgcolor: "rgba(50, 0, 0, 0.04)" },
    }}
  />
);

const NavButton = forwardRef(NavButtonComponent);

const Nav = styled("nav", { shouldForwardProp: (prop) => prop !== "linkWidth" })<{
  linkWidth: number;
}>(({ linkWidth, theme }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",

  "& div": {
    display: "inline-block",
    width: "100%",
    maxWidth: `${linkWidth}px`,
    textAlign: "center",
  },
  "& div:first-of-type": { marginLeft: theme.spacing(4) },
}));
