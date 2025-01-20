import { type FC, type ReactNode } from "react";

import theme from "@squonk/mui-theme";

import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

export interface ThemeProvidersProps {
  children: ReactNode;
}

/**
 * Provides the theme for Mui and emotion
 */
export const ThemeProviders: FC<ThemeProvidersProps> = ({ children }) => {
  return (
    <MuiThemeProvider defaultMode="light" theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
