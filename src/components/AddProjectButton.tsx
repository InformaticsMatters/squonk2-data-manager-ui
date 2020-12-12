import { useRef, useState } from 'react';

import styled from 'styled-components';

import {
  ClickAwayListener,
  Grow,
  IconButton,
  Paper as MuiPaper,
  Popper,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded';

interface IProps {
  addNewProject: (name: string) => void;
}

const AddProjectButton: React.FC<IProps> = ({ addNewProject }) => {
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
            <Paper id="create-new-project">
              <Typography gutterBottom variant="subtitle1">
                Project Name
              </Typography>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                {/* div can't be a fragment or ClickAwayListener fails silently */}
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

export default AddProjectButton;

const Paper = styled(MuiPaper)`
  padding: ${({ theme }) => theme.spacing(1)}px;
`;
