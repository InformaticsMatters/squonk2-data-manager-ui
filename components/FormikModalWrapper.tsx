import React from 'react';

import { Form, Formik, FormikConfig } from 'formik';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
} from '@material-ui/core';

import { SlideUpTransition } from './SlideUpTransition';

// Extend formik props so the modal wrapper takes all props <Formik /> would
interface ModalWrapperProps<Values> extends FormikConfig<Values> {
  title: string;
  submitText: string;
  open: boolean;
  onClose: () => void;
  DialogProps?: Partial<DialogProps>;
}

/**
 * Reusable Modal/Dialog component with Formik integration for easy Modal forms
 * Unlike the {@link ModalWrapper} component, the submit button is always required
 *
 * @privateRemarks
 *
 * Usual `Values extends unknown` doesn't work here
 */
export const FormikModalWrapper = <Values extends Record<string, unknown>>({
  title,
  submitText,
  open,
  onClose,
  children,
  DialogProps,
  ...formikProps
}: ModalWrapperProps<Values>) => {
  return (
    <Formik {...formikProps}>
      {({ submitForm, isSubmitting, ...rest }) => (
        <Form>
          <Dialog
            {...DialogProps}
            aria-labelledby="file-upload-title"
            open={open}
            TransitionComponent={SlideUpTransition}
            onClose={onClose}
          >
            <DialogTitle id="file-upload-title">{title}</DialogTitle>
            <DialogContent>
              {typeof children === 'function'
                ? children({ submitForm, isSubmitting, ...rest })
                : children}
            </DialogContent>
            <DialogActions>
              <Button color="default" onClick={onClose}>
                Close
              </Button>
              <Button disabled={isSubmitting} color="primary" onClick={submitForm}>
                {submitText}
              </Button>
            </DialogActions>
          </Dialog>
        </Form>
      )}
    </Formik>
  );
};
