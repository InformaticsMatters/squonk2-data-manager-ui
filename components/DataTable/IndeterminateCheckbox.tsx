import type { MutableRefObject } from 'react';
import { useRef } from 'react';
import { forwardRef, useEffect } from 'react';

import type { CheckboxProps } from '@mui/material';
import { Checkbox } from '@mui/material';

/**
 * Wrapped version of a MuiCheckbox that supports the native indeterminate attribute. Required for
 * use in react-table. Ref is forwarded to MuiCheckbox and takes same props as MuiCheckbox.
 */
export const IndeterminateCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = useRef();
    const resolvedRef = (ref || defaultRef) as MutableRefObject<HTMLButtonElement>;

    useEffect(() => {
      (resolvedRef.current as HTMLInputElement).indeterminate = !!indeterminate;
    }, [resolvedRef, indeterminate]);

    return <Checkbox indeterminate={indeterminate} ref={resolvedRef} size="small" {...rest} />;
  },
);
