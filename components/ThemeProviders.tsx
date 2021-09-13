import type { FC } from 'react';
import React from 'react';

import { generateThemes } from '@squonk/mui-theme';

import { ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@material-ui/core';
import { StylesProvider, ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';

import { useColorScheme } from '../components/state/colorSchemeContext';

const { darkTheme, lightTheme } = generateThemes();

export const ThemeProviders: FC = ({ children }) => {
  // Color Scheme
  const [scheme] = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </MuiThemeProvider>
    </StylesProvider>
  );
};
