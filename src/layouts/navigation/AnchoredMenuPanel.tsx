import { type ReactNode, useEffect } from "react";

import { ClickAwayListener, Grow, Paper } from "@mui/material";

export interface AnchoredMenuPanelProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the panel, which is exposed as a region. */
  label: string;
  width: number;
  children: ReactNode;
}

const Panel = ({ onClose, label, width, children }: Omit<AnchoredMenuPanelProps, "open">) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Grow in>
        <Paper
          aria-label={label}
          component="section"
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

/**
 * A dropdown anchored to whatever positioned element contains it.
 *
 * Nothing is portalled and there is no backdrop, so the page underneath keeps receiving pointer
 * events, while a `ClickAwayListener` closes the panel on an outside click *without* swallowing
 * that click. That combination is the point: a `Popper` never closes on an outside click, and a
 * `Popover` closes but eats the click that closed it, so the caller has to aim twice. Escape
 * closes it too, and the listener is mounted only while the panel is.
 */
export const AnchoredMenuPanel = ({ open, ...panelProps }: AnchoredMenuPanelProps) =>
  open ? <Panel {...panelProps} /> : null;
