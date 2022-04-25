import { useState } from 'react';

import { ListItem, ListItemText } from '@material-ui/core';
import { NoteAdd } from '@material-ui/icons';

import { useOrganisationUnit } from '../../../../../../context/organisationUnitContext';
import { CreateProjectForm } from '../../../../../CreateProjectForm';

/**
 * Button which allows user to create a new project.
 */
export const CreateProjectListItem = () => {
  const [open, setOpen] = useState(false);

  const {
    organisationUnit: { organisation, unit },
  } = useOrganisationUnit();

  return (
    <>
      <ListItem
        button
        disabled={organisation === null || unit === null}
        onClick={() => setOpen(true)}
      >
        <ListItemText
          primary="Create Project"
          secondary="Creates a new project in the currently selected context"
        />
        <NoteAdd color="action" />
      </ListItem>

      {!!organisation && !!unit && (
        <CreateProjectForm
          modal={{
            id: 'create-project',
            title: 'Create Project',
            submitText: 'Create',
            open,
            onClose: () => setOpen(false),
          }}
          orgAndUnit={[organisation.id, unit.id]}
        />
      )}
    </>
  );
};
