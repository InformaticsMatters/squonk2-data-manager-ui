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

  useEffect(() => {
    (resolvedRef.current as HTMLInputElement).indeterminate = !!(indeterminate ?? false);
  }, [resolvedRef, indeterminate]);

  return <Checkbox indeterminate={indeterminate} ref={resolvedRef} size="small" {...rest} />;
};

export const IndeterminateCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
  IndeterminateCheckboxComponent,
);
