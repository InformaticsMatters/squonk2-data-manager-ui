import React from 'react';

import { css } from '@emotion/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@material-ui/core';
import CloseRoundedIcon from '@material-ui/icons/CloseRounded';

import { SlideUpTransition } from '../SlideUpTransition';
import type { BaseModalWrapperProps } from './types';

export interface ModalWrapperProps extends BaseModalWrapperProps {
  /**
   * Called when the primary action is clicked
   */
  onSubmit?: () => void;

  /**
   * Text of the primary action button
   */
  submitText?: string;
  /**
   * Whether the primary action should be in a disabled state.
   */
  submitDisabled?: boolean;
}

/**
 * Generic modal component with submit action
 */
export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  id,
  title,
  submitText,
  submitDisabled,
  children,
  open,
  onClose,
  onSubmit,
  DialogProps,
}) => {
  const theme = useTheme();
  return (
    <Dialog
      {...DialogProps}
      aria-labelledby={`${id}-title`}
      open={open}
      TransitionComponent={SlideUpTransition}
      onClose={onClose}
    >
      <DialogTitle disableTypography id={`${id}-title`}>
        <Typography component="h2" variant="h3">
          {title}
        </Typography>
        <IconButton
          css={css`
            z-index: ${theme.zIndex.appBar + 1};
            position: absolute;
            right: ${theme.spacing(2)}px;
            top: ${theme.spacing(2)}px;
            color: ${theme.palette.text.primary};
          `}
          size="small"
          onClick={onClose}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button color="default" onClick={onClose}>
          Close
        </Button>
        {onSubmit && (
          <Button color="primary" disabled={submitDisabled} onClick={onSubmit}>
            {submitText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
