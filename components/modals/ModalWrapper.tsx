import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';

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
      <DialogTitle id={`${id}-title`}>
        <Typography component="span" variant="h3">
          {title}
        </Typography>
        <IconButton
          size="small"
          sx={{
            zIndex: theme.zIndex.appBar + 1,
            position: 'absolute',
            right: theme.spacing(2),
            top: theme.spacing(1.5),
            color: 'text.primary',
          }}
          onClick={onClose}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {onSubmit && (
          <Button color="primary" disabled={submitDisabled} onClick={onSubmit}>
            {submitText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
