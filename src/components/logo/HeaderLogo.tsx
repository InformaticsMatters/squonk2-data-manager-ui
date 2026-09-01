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

/**
 * The link's own colour is the bar's text colour rather than the link colour it would default to,
 * which here is the primary — the colour of the bar itself. Nothing in the link is text, so that
 * never showed; the focus ring is drawn in `currentColor`, so it was drawn red on red and this was
 * the one control in the masthead a keyboard could reach without seeing.
 */
const LogoLink = styled(NextLink)(({ theme }) => ({
  color: "inherit",
  display: "inline-block",
  maxHeight: "68px",
  padding: theme.spacing(0.5, 0),
}));
