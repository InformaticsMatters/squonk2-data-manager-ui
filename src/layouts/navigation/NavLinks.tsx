import { forwardRef } from "react";

import { Button, type ButtonProps, styled } from "@mui/material";
import A, { type LinkProps as NextLinkProps } from "next/link";
import { useRouter } from "next/router";

import { NAV_LINKS, NAV_PARAMS_TO_STRIP, type NavLinkData } from "./navigationConstants";

export interface NavLinksProps {
  /**
   * Maximum width of the link in pixels
   */
  linkWidth?: number;
}

export const NavLinks = ({ linkWidth = 120 }: NavLinksProps) => {
  const router = useRouter();

  return (
    <Nav aria-label="Main" linkWidth={linkWidth} role="navigation">
      {NAV_LINKS.map(({ title, path, text }: NavLinkData) => {
        const active = router.pathname.startsWith(path);
        const query = { ...router.query };
        NAV_PARAMS_TO_STRIP.forEach((param: string) => delete query[param]);
        const href = { query, pathname: path };

        return (
          <div key={title}>
            <NavButton active={active} component={A} href={href}>
              {text}
            </NavButton>
          </div>
        );
      })}
    </Nav>
  );
};

type NavButtonProps = Omit<ButtonProps, "href"> & {
  active: boolean;
  href?: NextLinkProps["href"];
};

const NavButton = forwardRef<HTMLAnchorElement | HTMLButtonElement, NavButtonProps>(
  ({ active, ...props }, ref) => (
    <Button
      ref={ref}
      variant="text"
      // Type assertion needed due to complex polymorphic props (ButtonProps + NextLinkProps)
      // and MUI Button overload complexity.
      {...(props as any)}
      sx={{
        fontWeight: active ? "bold" : "normal",
        color: "white",
        textTransform: "none",
        ":hover": { bgcolor: "rgba(50, 0, 0, 0.04)" },
      }}
    />
  ),
);

NavButton.displayName = "NavButton";

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
