import { type FC, type ReactNode } from "react";

import theme from "@squonk/mui-theme";

import { chipClasses, CssBaseline, StepIcon, type StepIconProps } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

import {
  CheckboxCheckedIcon,
  CheckboxIcon,
  CheckboxPartialIcon,
  CloseIcon,
  DropdownIcon,
  ErrorIcon,
  InfoIcon,
  RadioCheckedIcon,
  RadioIcon,
  SortIcon,
  SucceededIcon,
  SuccessIcon,
  WarningIcon,
} from "../icons";

const { components } = theme;

/**
 * A stepper's step: the application's icons for a finished or failed step, and Material's numbered
 * circle for the rest, which is a number rather than an icon.
 */
const ApplicationStepIcon = (props: StepIconProps) => {
  if (props.completed) {
    return <SucceededIcon className={props.className} color="primary" />;
  }
  if (props.error) {
    return <ErrorIcon className={props.className} color="error" />;
  }
  return <StepIcon {...props} />;
};

/**
 * The shared theme, with the icons Material UI components draw for themselves replaced by the
 * application's own. The shared theme stays icon-agnostic, so this is added here rather than there;
 * each component keeps whatever the shared theme already set for it.
 */
const applicationTheme: typeof theme = {
  ...theme,
  components: {
    ...components,
    MuiAlert: {
      ...components?.MuiAlert,
      defaultProps: {
        ...components?.MuiAlert?.defaultProps,
        iconMapping: {
          error: <ErrorIcon fontSize="inherit" />,
          info: <InfoIcon fontSize="inherit" />,
          success: <SuccessIcon fontSize="inherit" />,
          warning: <WarningIcon fontSize="inherit" />,
        },
      },
    },
    MuiAutocomplete: {
      ...components?.MuiAutocomplete,
      defaultProps: {
        ...components?.MuiAutocomplete?.defaultProps,
        clearIcon: <CloseIcon fontSize="small" />,
        popupIcon: <DropdownIcon />,
      },
    },
    MuiCheckbox: {
      ...components?.MuiCheckbox,
      defaultProps: {
        ...components?.MuiCheckbox?.defaultProps,
        checkedIcon: <CheckboxCheckedIcon />,
        icon: <CheckboxIcon />,
        indeterminateIcon: <CheckboxPartialIcon />,
      },
    },
    MuiChip: {
      ...components?.MuiChip,
      defaultProps: { ...components?.MuiChip?.defaultProps, deleteIcon: <CloseIcon /> },
      // Lucide glyphs fill more of their box than Material's did, so a chip's icon is given more room
      // from the chip's edge and its label than Material's spacing leaves.
      styleOverrides: {
        ...components?.MuiChip?.styleOverrides,
        sizeMedium: {
          ...(components?.MuiChip?.styleOverrides?.sizeMedium as object | undefined),
          [`& .${chipClasses.icon}`]: { fontSize: 20, marginLeft: 8, marginRight: -4 },
        },
        sizeSmall: {
          ...(components?.MuiChip?.styleOverrides?.sizeSmall as object | undefined),
          [`& .${chipClasses.icon}`]: { fontSize: 16, marginLeft: 6, marginRight: -2 },
        },
      },
    },
    MuiRadio: {
      ...components?.MuiRadio,
      defaultProps: {
        ...components?.MuiRadio?.defaultProps,
        checkedIcon: <RadioCheckedIcon />,
        icon: <RadioIcon />,
      },
    },
    MuiSelect: {
      ...components?.MuiSelect,
      defaultProps: { ...components?.MuiSelect?.defaultProps, IconComponent: DropdownIcon },
    },
    MuiStepLabel: {
      ...components?.MuiStepLabel,
      defaultProps: {
        ...components?.MuiStepLabel?.defaultProps,
        slots: { ...components?.MuiStepLabel?.defaultProps?.slots, stepIcon: ApplicationStepIcon },
      },
    },
    MuiTableSortLabel: {
      ...components?.MuiTableSortLabel,
      defaultProps: { ...components?.MuiTableSortLabel?.defaultProps, IconComponent: SortIcon },
    },
  },
};

export interface ThemeProvidersProps {
  children: ReactNode;
}

/**
 * Provides the theme for Mui and emotion
 */
export const ThemeProviders: FC<ThemeProvidersProps> = ({ children }) => {
  return (
    <MuiThemeProvider defaultMode="light" theme={applicationTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
