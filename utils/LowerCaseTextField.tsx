import type { ChangeEvent } from "react";
import { useCallback } from "react";

import { TextField as MuiTextField } from "@mui/material";
import type { TextFieldProps } from "formik-mui";
import { fieldToTextField } from "formik-mui";

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
      setFieldValue(name, value ? value.toLowerCase() : "");
    },
    [setFieldValue, name],
  );

  return <MuiTextField {...fieldToTextField(props)} onChange={onChange} />;
};
