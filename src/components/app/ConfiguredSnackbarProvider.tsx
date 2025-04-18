import { forwardRef, type PropsWithChildren } from "react";

import { Alert } from "@mui/material";
import { type CustomContentProps, SnackbarProvider } from "notistack";

const CustomSnackbar = forwardRef<HTMLDivElement, CustomContentProps>(
  ({ message, variant = "default" }, ref) => {
    // Map notistack variants to MUI Alert severity
    const severity = variant === "default" ? "info" : variant;

    return (
      <Alert
        ref={ref}
        severity={severity}
        sx={{ width: "100%", bgcolor: "background.paper" }}
        variant="outlined"
      >
        {message}
      </Alert>
    );
  },
);

CustomSnackbar.displayName = "CustomSnackbar";

export const ConfiguredSnackbarProvider = ({ children }: PropsWithChildren) => (
  <SnackbarProvider
    Components={{
      success: CustomSnackbar,
      error: CustomSnackbar,
      warning: CustomSnackbar,
      info: CustomSnackbar,
      default: CustomSnackbar,
    }}
  >
    {children}
  </SnackbarProvider>
);
