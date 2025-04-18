import { useColorScheme } from "@mui/material";
import Image from "next/image";

import logo from "../../../assets/graphics/app-logos/data-manager.svg";
import logoWhite from "../../../assets/graphics/app-logos/data-manager-white-tear-variant.svg";

export interface LogoImageProps {
  variant?: "dark" | "light";
}

const alt = "Squonk (animal) logo with title text 'Squonk' and subtitle 'Data Manager'";

export const LogoImage = ({ variant }: LogoImageProps) => {
  const { mode } = useColorScheme();

  return (variant ?? mode) === "dark" ? (
    <Image priority alt={alt} height="60" src={logoWhite} width="206" />
  ) : (
    <Image priority alt={alt} height="60" src={logo} width="206" />
  );
};
