import { Fira_Mono as firaMono, Open_Sans as openSans } from "next/font/google";
import localFont from "next/font/local";

export const openSansFont = openSans({
  weight: "variable",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const firaMonoFont = firaMono({
  weight: "400",
  subsets: ["latin"],
});

export const ralewayFont = localFont({
  src: [
    {
      path: "../../assets/fonts/Raleway/Raleway-Regular.woff2",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Raleway/Raleway-Italic.woff2",
      style: "italic",
    },
    {
      path: "../../assets/fonts/Raleway/Raleway-Bold.woff2",
      weight: "700",
    },
  ],
});
