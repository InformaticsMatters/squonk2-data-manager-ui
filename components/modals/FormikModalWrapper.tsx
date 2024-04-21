import { type DialogProps } from "@mui/material";
import { Form, Formik, type FormikConfig, type FormikValues } from "formik";

import { ModalWrapper } from "./ModalWrapper";
import { type BaseModalWrapperProps } from "./types";

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
export const FormikModalWrapper = <Values extends FormikValues>({
  id,
  title,
  submitText,
  open,
  onClose,
  children,
  DialogProps,
  ...formikProps
}: FormikConfig<Values> & FormikModalWrapperProps) => {
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
            onSubmit={() => void submitForm()}
          >
            {typeof children === "function"
              ? children({ isValid, submitForm, isSubmitting, ...rest })
              : children}
          </ModalWrapper>
        </Form>
      )}
    </Formik>
  );
};
