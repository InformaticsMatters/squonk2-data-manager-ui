import { type ReactNode } from "react";

import { type DialogProps } from "@mui/material";

import { ModalWrapper } from "./ModalWrapper";
import { type BaseModalWrapperProps } from "./types";

export interface FormModalWrapperProps extends BaseModalWrapperProps {
  /**
   * ID given to the aria properties. Required for ensure good accessibility.
   */
  id: string;
  /**
   * Title text of the modal
   */
  title: string;
  /**
   * Text displayed in the submit button
   */
  submitText: string;
  /**
   * Text displayed in the close button. Defaults to "Close"
   */
  closeText?: string;
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Called when a close action is initiated. E.g. close button, submit or click-away
   */
  onClose: () => void;
  /**
   * Props forwarded to the MuiDialog component
   */
  DialogProps?: Partial<DialogProps>;
  /**
   * The Tanstack Form instance
   */
  form: {
    handleSubmit: () => Promise<void>;
    reset: () => void;
    state: {
      canSubmit: boolean;
      isSubmitting?: boolean;
    };
  };
  /**
   * Children can be a function that receives the form instance
   */
  children: ReactNode;
}

/**
 * Reusable Modal/Dialog component with Tanstack Form integration for easy Modal forms
 * Unlike the {@link ModalWrapper} component, the submit button is always required
 */
export const FormModalWrapper = ({
  id,
  title,
  submitText,
  closeText,
  open,
  onClose,
  children,
  DialogProps,
  form,
}: FormModalWrapperProps) => {
  return (
    <form
      style={{ display: "inline" }}
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <ModalWrapper
        closeText={closeText}
        DialogProps={{
          onTransitionExited: () => form.reset(),
          ...DialogProps,
        }}
        id={id}
        open={open}
        submitDisabled={!form.state.canSubmit || !!form.state.isSubmitting}
        submitText={submitText}
        title={title}
        onClose={onClose}
        onSubmit={() => void form.handleSubmit()}
      >
        {children}
      </ModalWrapper>
    </form>
  );
};
