import type { FC } from 'react';

import { generateThemes } from '@squonk/mui-theme';

import { ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import StylesProvider from '@mui/styles/StylesProvider';

import { useColorScheme } from '../context/colorSchemeContext';

const { darkTheme, lightTheme } = generateThemes();

/**
 * Provides the theme for Mui and emotion
 */
export const ThemeProviders: FC = ({ children }) => {
  // Color Scheme
  const [scheme] = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <StylesProvider injectFirst>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </MuiThemeProvider>
      </StyledEngineProvider>
    </StylesProvider>
  );
};
