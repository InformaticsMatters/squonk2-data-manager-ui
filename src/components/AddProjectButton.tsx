import React, { useRef, useState } from 'react';

import { Button, ClickAwayListener, Grow, Paper, Popper, TextField } from '@material-ui/core';

import APIService from '../Services/APIService';

interface IProps {
  refreshProjects: () => void;
}

const AddProjectButton: React.FC<IProps> = ({ refreshProjects }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  return (
    <>
      <Button ref={anchorRef} onClick={() => setOpen(true)}>
        Add
      </Button>
      <Popper open={open} anchorEl={anchorRef.current} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper id="create-new-project">
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                {/* div can't be a fragment or ClickAwayListener fails silently */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();

                    const target = e.target as typeof e.target & {
                      projectName: { value: string };
                    };
                    const name = target.projectName.value;

                    await APIService.createNewProject(name);
                    setTimeout(refreshProjects, 500);
                    setOpen(false);
                  }}
                >
                  <TextField name="projectName" variant="outlined" required autoFocus />
                </form>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default AddProjectButton;
