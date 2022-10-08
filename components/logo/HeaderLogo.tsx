import { styled } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { LogoImage } from "./LogoImage";

/**
 * Squonk Logo
 */
export const HeaderLogo = () => {
  const { query } = useRouter();

  return (
    <Link passHref href={{ pathname: "/", query: query.project ? { project: query.project } : {} }}>
      <LogoLink>
        <LogoImage variant="dark" />
      </LogoLink>
    </Link>
  );
};

const LogoLink = styled("a")(({ theme }) => ({
  display: "inline-block",
  maxHeight: "68px",
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));
