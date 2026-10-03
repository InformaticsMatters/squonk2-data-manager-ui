import { type ReactNode } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";

import { CloseIcon } from "../icons";
import { ReasonsRestatedHere } from "../results/CapabilityReasons";
import { SlideUpTransition } from "../SlideUpTransition";
import { type BaseModalWrapperProps } from "./types";

export interface ModalWrapperProps extends BaseModalWrapperProps {
  children: ReactNode;
  /**
   * Called when the primary action is clicked
   */
  onSubmit?: () => void;

  /**
   * Text of the primary action button
   */
  submitText?: string;
  /**
   * Icon of the primary action, placed before its text. Every primary action has one.
   */
  submitIcon?: ReactNode;
  /**
   * Icon placed before the title.
   */
  titleIcon?: ReactNode;
  /**
   * Whether the primary action should be in a disabled state.
   */
  submitDisabled?: boolean;
  /**
   * Text to be displayed as the close text button. Defaylt is "Close"
   */
  closeText?: string;
}

/**
 * Generic modal component with submit action
 */
export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  id,
  title,
  submitText,
  submitIcon,
  titleIcon,
  submitDisabled,
  closeText = "Close",
  children,
  open,
  onClose,
  onSubmit,
  DialogProps,
}) => {
  return (
    <Dialog
      {...DialogProps}
      aria-labelledby={`${id}-title`}
      open={open}
      slots={{ transition: SlideUpTransition }}
      onClose={onClose}
    >
      <DialogTitle id={`${id}-title`}>
        <Typography
          component="span"
          sx={{ alignItems: "center", display: "inline-flex", gap: 1 }}
          variant="h3"
        >
          {titleIcon}
          {title}
        </Typography>
        <IconButton
          size="small"
          sx={(theme) => ({
            zIndex: theme.zIndex.appBar + 1,
            position: "absolute",
            right: theme.spacing(2),
            top: theme.spacing(1.5),
            color: "text.primary",
          })}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      {/* A dialog covers the page it opened over, so whatever that page stated once above its
          controls is restated by the controls in here. */}
      <DialogContent>
        <ReasonsRestatedHere>{children}</ReasonsRestatedHere>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{closeText}</Button>
        {!!onSubmit && (
          <Button
            color="primary"
            disabled={submitDisabled}
            startIcon={submitIcon}
            onClick={onSubmit}
          >
            {submitText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
