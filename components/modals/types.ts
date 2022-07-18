import type { DialogProps } from "@mui/material";

export interface BaseModalWrapperProps {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  DialogProps?: Partial<DialogProps>;
}
