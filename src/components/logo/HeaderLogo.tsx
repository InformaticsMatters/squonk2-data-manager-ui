import { styled } from "@mui/material";

import { NextLink } from "../NextLink";
import { LogoImage } from "./LogoImage";

/**
 * Squonk Logo
 */
export const HeaderLogo = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
  return (
    <LogoLink aria-label="Squonk Home" component="a" href="/">
      <LogoImage variant={variant} />
    </LogoLink>
  );
};

const LogoLink = styled(NextLink)(({ theme }) => ({
  display: "inline-block",
  maxHeight: "68px",
  padding: theme.spacing(0.5, 0),
}));
