import Image from "next/future/image";

import { useColorScheme } from "../../state/colorScheme";

export interface LogoImageProps {
  variant?: "dark" | "light";
}

const alt = "Squonk (animal) logo with title text 'Squonk' and subtitle 'Data Manager'";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

export const LogoImage = ({ variant }: LogoImageProps) => {
  const [scheme] = useColorScheme();

  if (variant === undefined) {
    variant = scheme;
  }

  return variant === "dark" ? (
    <Image
      priority
      alt={alt}
      height="60"
      src={basePath + "/DataManager_WhiteOpt2.svg"}
      width="206"
    />
  ) : (
    <Image priority alt={alt} height="60" src={basePath + "/DataManager.svg"} width="206" />
  );
};
