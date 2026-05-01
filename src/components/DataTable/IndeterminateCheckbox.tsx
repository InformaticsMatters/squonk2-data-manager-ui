import { type ForwardedRef, forwardRef, type RefObject, useEffect, useRef } from "react";

import { Checkbox, type CheckboxProps } from "@mui/material";

/**
 * Wrapped version of a MuiCheckbox that supports the native indeterminate attribute. Required for
 * use in react-table. Ref is forwarded to MuiCheckbox and takes same props as MuiCheckbox.
 */
const IndeterminateCheckboxComponent = (
  { indeterminate, ...rest }: CheckboxProps,
  ref: ForwardedRef<HTMLInputElement>,
) => {
  const defaultRef = useRef<HTMLButtonElement>(null);
  const resolvedRef = (ref ?? defaultRef) as RefObject<HTMLButtonElement>;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = !!(indeterminate ?? false);
    }
  }, [indeterminate]);

  return (
    <Checkbox
      indeterminate={indeterminate}
      inputRef={inputRef}
      ref={resolvedRef}
      size="small"
      {...rest}
    />
  );
};

export const IndeterminateCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
  IndeterminateCheckboxComponent,
);
