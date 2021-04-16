import React, { useRef, useState } from 'react';

import { css } from '@emotion/react';
import {
  ClickAwayListener,
  Grow,
  IconButton,
  Paper,
  Popper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded';

interface IProps {
  addNewProject: (name: string) => void;
}

const AddProject: React.FC<IProps> = ({ addNewProject }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  return (
    <>
      <Tooltip arrow title="Add new project">
        <IconButton ref={anchorRef} onClick={() => setOpen(true)}>
          <AddCircleRoundedIcon />
        </IconButton>
      </Tooltip>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
        placement="right-end"
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper
              id="create-new-project"
              css={css`
                padding: ${theme.spacing(1)}px;
              `}
            >
              <Typography gutterBottom variant="subtitle1">
                Project Name
              </Typography>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();

                    const target = e.target as typeof e.target & {
                      projectName: { value: string };
                    };
                    const name = target.projectName.value;
                    addNewProject(name);

                    setOpen(false);
                  }}
                >
                  <TextField
                    inputProps={{ maxLength: 18 }}
                    name="projectName"
                    variant="outlined"
                    required
                    autoFocus
                  />
                </form>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default AddProject;
