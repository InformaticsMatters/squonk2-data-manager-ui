import type { FC } from "react";
import { useEffect, useState } from "react";

import { generateThemes } from "@squonk/mui-theme";

import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

import { useColorScheme } from "../../state/colorScheme";

const { darkTheme, lightTheme } = generateThemes();

/**
 * Provides the theme for Mui and emotion
 */
export const ThemeProviders: FC = ({ children }) => {
  // Color Scheme
  const [scheme] = useColorScheme();
  const [theme, setTheme] = useState(lightTheme);

  // Set the theme client-side since we don't know whether the user has dark mode enabled in their
  // localStorage
  useEffect(() => {
    if (scheme === "dark") {
      setTheme(darkTheme);
    } else {
      setTheme(lightTheme);
    }
  }, [scheme]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
