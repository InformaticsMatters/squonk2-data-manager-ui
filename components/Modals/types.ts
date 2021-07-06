import { DialogProps } from '@material-ui/core';

export interface BaseModalWrapperProps {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  DialogProps?: Partial<DialogProps>;
}
