import React from 'react';

import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { IconButton, Popover, TextField, Tooltip } from '@material-ui/core';
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded';
import { useAddNewProject, useGetAvailableProjects } from '@squonk/data-manager-client';

const AddProject: React.FC = () => {
  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'add-project',
  });

  const { refetch } = useGetAvailableProjects();
  const mutation = useAddNewProject();

  return (
    <div>
      <Tooltip arrow title="Add new project">
        <IconButton {...bindTrigger(popupState)}>
          <AddCircleRoundedIcon />
        </IconButton>
      </Tooltip>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const target = e.target as typeof e.target & {
              projectName: { value: string };
            };
            const name = target.projectName.value.trim();
            if (name) {
              await mutation.mutateAsync({ data: { name } });
              refetch();
              popupState.close();
            }
          }}
        >
          <TextField
            inputProps={{ maxLength: 18 }}
            label="Project Name"
            name="projectName"
            variant="outlined"
            autoFocus
          />
        </form>
      </Popover>
    </div>
  );
};

export default AddProject;
