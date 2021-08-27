import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import React from 'react';

import { TextField as MuiTextField } from '@material-ui/core';
import type { TextFieldProps } from 'formik-material-ui';
import { fieldToTextField } from 'formik-material-ui';

/**
 * Formik binding for a Mui TextField forcing the typed text to lowercase
 */
export const LowerCaseTextField = (props: TextFieldProps) => {
  const {
    form: { setFieldValue },
    field: { name },
  } = props;

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setFieldValue(name, value ? value.toLowerCase() : '');
    },
    [setFieldValue, name],
  );

  return <MuiTextField {...fieldToTextField(props)} onChange={onChange} />;
};
