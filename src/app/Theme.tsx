import React from 'react';

import { ThemeProvider } from 'styled-components';

import {
  createMuiTheme,
  StylesProvider,
  ThemeProvider as MuiThemeProvider,
} from '@material-ui/core/styles';

interface IProps {}

export const theme = createMuiTheme();

const Theme: React.FC<IProps> = ({ children }) => {
  return (
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </MuiThemeProvider>
    </StylesProvider>
  );
};

export default Theme;
