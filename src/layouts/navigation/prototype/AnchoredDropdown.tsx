// PROTOTYPE — throwaway. The settled mechanism; every variant differs only in its content.
import { type ReactNode, useEffect } from "react";

import { ClickAwayListener, Grow, Paper } from "@mui/material";

import { AuthButton } from "../../../components/auth/AuthButton";
import { useUserMenuOpen } from "./shared";

/**
 * An absolutely positioned Paper inside the toolbar: nothing is portalled and there is no
 * backdrop, so the page keeps receiving pointer events, while a ClickAwayListener closes it on an
 * outside click *without* swallowing that click. Escape closes it too.
 */
export const AnchoredDropdown = ({ children, width }: { children: ReactNode; width: number }) => {
  const [open, setOpen] = useUserMenuOpen();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  if (!open) {
    return null;
  }

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Grow in>
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width,
            maxWidth: "calc(100vw - 32px)",
            overflow: "hidden",
            zIndex: (theme) => theme.zIndex.appBar + 1,
          }}
        >
          {children}
        </Paper>
      </Grow>
    </ClickAwayListener>
  );
};

/** Not the question being answered, so every variant shares it. */
export const SignedOut = () => (
  <AuthButton fullWidth mode="login" sx={{ m: 2, width: "auto" }} variant="contained" />
);
