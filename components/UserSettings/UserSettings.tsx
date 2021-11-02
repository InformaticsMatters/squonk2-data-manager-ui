import { useState } from 'react';

import { Link } from '@material-ui/core';

import { ModalWrapper } from '../modals/ModalWrapper';
import { UserSettingsContent } from './UserSettingsContent';

/**
 * A button styled as a link which displays User Settings on click.
 */
export const UserSettings = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Link component="button" variant="body1" onClick={() => setOpen(true)}>
        Settings
      </Link>
      <ModalWrapper
        DialogProps={{ fullScreen: true }}
        id="user-settings"
        open={open}
        title="Settings"
        onClose={() => setOpen(false)}
      >
        <UserSettingsContent />
      </ModalWrapper>
    </>
  );
};
