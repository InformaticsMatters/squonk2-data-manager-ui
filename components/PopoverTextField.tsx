import type { FC } from 'react';
import React, { useRef } from 'react';

import type { TextFieldProps } from '@material-ui/core';
import { Popover, TextField } from '@material-ui/core';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

interface PopoverTextFieldProps {
  onSubmit: (value: string) => Promise<void> | void;
  popoverId: string;
  children: (props: ReturnType<typeof bindTrigger>) => React.ReactNode;
  name: string;
}

export const PopoverTextField: FC<Omit<TextFieldProps, 'onSubmit'> & PopoverTextFieldProps> = ({
  children,
  onSubmit,
  popoverId,
  ...TextFieldProps
}) => {
  const popupState = usePopupState({ variant: 'popover', popupId: popoverId });

  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      {children(bindTrigger(popupState))}
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <form
          ref={formRef}
          onSubmit={async (event) => {
            event.preventDefault();

            if (formRef.current) {
              const formData = new FormData(formRef.current);
              const value = formData.get(TextFieldProps.name);
              value && (await onSubmit(value as string));
            }

            popupState.close();
          }}
        >
          <TextField autoFocus inputProps={{ maxLength: 18 }} {...TextFieldProps} />
        </form>
      </Popover>
    </>
  );
};
