import { FC, useRef } from 'react';

import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { Popover, TextField } from '@material-ui/core';

interface PopoverTextFieldProps {
  onSubmit: (value: string) => Promise<void>;
  textFieldLabel: string;
  textFieldName: string;
  popoverId: string;
  children: (props: ReturnType<typeof bindTrigger>) => React.ReactNode;
}

export const PopoverTextField: FC<PopoverTextFieldProps> = ({
  children,
  onSubmit,
  textFieldLabel,
  textFieldName,
  popoverId,
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
              const value = formData.get(textFieldName);
              value && (await onSubmit(value as string));
            }

            popupState.close();
          }}
        >
          <TextField
            autoFocus
            inputProps={{ maxLength: 18 }}
            label={textFieldLabel}
            name={textFieldName}
            variant="outlined"
          />
        </form>
      </Popover>
    </>
  );
};
