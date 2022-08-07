import { styled } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

/**
 * Squonk Logo
 */
export const Logo = () => {
  const { query } = useRouter();

  return (
    <Link passHref href={{ pathname: "/", query: { project: query.project } }}>
      <LogoLink>
        <Image
          alt="Squonk (animal) logo with title text 'Squonk' and subtitle 'Data Manager'"
          height="60"
          layout="fixed"
          src={process.env.NEXT_PUBLIC_BASE_PATH + "/DataManager_WhiteOpt2.svg"}
          width="206"
        />
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
