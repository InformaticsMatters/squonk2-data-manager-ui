import { styled } from "@mui/material";
import { useRouter } from "next/router";

import { NextLink } from "../NextLink";
import { LogoImage } from "./LogoImage";

/**
 * Squonk Logo
 */
export const HeaderLogo = () => {
  const { query } = useRouter();

  return (
    <LogoLink
      component="a"
      href={{ pathname: "/", query: query.project ? { project: query.project } : {} }}
    >
      <LogoImage variant="dark" />
    </LogoLink>
  );
};

const LogoLink = styled(NextLink)(({ theme }) => ({
  display: "inline-block",
  maxHeight: "68px",
  padding: theme.spacing(0.5, 0),
}));
