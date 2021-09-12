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

interface ModalWrapperProps extends BaseModalWrapperProps {
  onSubmit?: () => void;
  submitText?: string;
  submitDisabled?: boolean;
}

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
