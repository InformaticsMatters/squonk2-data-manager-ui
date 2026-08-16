import { styled } from "@mui/material";

import { NextLink } from "../NextLink";
import { LogoImage } from "./LogoImage";

/**
 * Squonk Logo
 */
export const HeaderLogo = () => {
  return (
    <LogoLink aria-label="Squonk Home" component="a" href="/">
      {/* The bar is the primary colour in every shell, so the logo is always the light-on-dark
      variant. */}
      <LogoImage variant="dark" />
    </LogoLink>
  );
};

const LogoLink = styled(NextLink)(({ theme }) => ({
  display: "inline-block",
  maxHeight: "68px",
  padding: theme.spacing(0.5, 0),
}));
