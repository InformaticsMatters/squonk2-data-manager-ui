import type { MutableRefObject } from 'react';
import React, { forwardRef, useEffect } from 'react';

import type { CheckboxProps } from '@material-ui/core';
import { Checkbox } from '@material-ui/core';

export const IndeterminateCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = React.useRef();
    const resolvedRef = (ref || defaultRef) as MutableRefObject<HTMLButtonElement>;

    useEffect(() => {
      (resolvedRef.current as HTMLInputElement).indeterminate = !!indeterminate;
    }, [resolvedRef, indeterminate]);

    return <Checkbox indeterminate={indeterminate} ref={resolvedRef} size="small" {...rest} />;
  },
);
