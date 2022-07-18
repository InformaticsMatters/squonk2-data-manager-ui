import type { DialogProps } from "@mui/material";
import type { FormikConfig } from "formik";
import { Form, Formik } from "formik";

import { ModalWrapper } from "./ModalWrapper";
import type { BaseModalWrapperProps } from "./types";

export interface FormikModalWrapperProps extends BaseModalWrapperProps {
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
}

/**
 * Reusable Modal/Dialog component with Formik integration for easy Modal forms
 * Unlike the {@link ModalWrapper} component, the submit button is always required
 *
 * @privateRemarks
 *
 * We use a function here instead of arrow functions as generics work better with them
 */
export function FormikModalWrapper<Values>({
  id,
  title,
  submitText,
  open,
  onClose,
  children,
  DialogProps,
  ...formikProps
}: FormikModalWrapperProps & FormikConfig<Values>) {
  return (
    <Formik {...formikProps}>
      {({ submitForm, isSubmitting, isValid, ...rest }) => (
        <Form style={{ display: "inline" }}>
          <ModalWrapper
            DialogProps={DialogProps}
            id={id}
            open={open}
            submitDisabled={isSubmitting || !isValid}
            submitText={submitText}
            title={title}
            onClose={onClose}
            onSubmit={submitForm}
          >
            {typeof children === "function"
              ? children({ isValid, submitForm, isSubmitting, ...rest })
              : children}
          </ModalWrapper>
        </Form>
      )}
    </Formik>
  );
}
