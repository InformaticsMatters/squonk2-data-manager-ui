import { Fira_Mono as firaMono, Open_Sans as openSans } from "next/font/google";

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
