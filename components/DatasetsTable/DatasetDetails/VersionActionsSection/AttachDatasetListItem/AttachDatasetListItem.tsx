import React, { useState } from 'react';
import { useQueryClient } from 'react-query';

import type { DatasetVersionSummary, Error as DMError } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey } from '@squonk/data-manager-client/dataset';
import { useAttachFile } from '@squonk/data-manager-client/file';
import { getGetProjectQueryKey, useGetProjects } from '@squonk/data-manager-client/project';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { ListItemText } from '@material-ui/core';
import { ListItem } from '@material-ui/core';
import { FormControl, FormGroup, MenuItem } from '@material-ui/core';
import AttachFileRoundedIcon from '@material-ui/icons/AttachFileRounded';
import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';
import { Field } from 'formik';
import { CheckboxWithLabel, TextField } from 'formik-material-ui';
import * as yup from 'yup';

import { useKeycloakUser } from '../../../../../hooks/useKeycloakUser';
import { FormikModalWrapper } from '../../../../modals/FormikModalWrapper';
import { useGetAttachedProjectsNames } from './useGetAttachedProjectsNames';

export interface AttachDatasetListItemProps {
  /**
   * The dataset-id corresponding to the dataset which will be attached.
   */
  datasetId: string;
  /**
   * The {@link DatasetVersionSummary version} of the dataset to be attached
   */
  version: DatasetVersionSummary;
}

interface FormState {
  project: string;
  type: string;
  path: string;
  isImmutable: boolean;
  isCompress: boolean;
}

/**
 * MuiListItem with a click action that opens a modal allowing a dataset to be attached to a project
 */
export const AttachDatasetListItem = ({ datasetId, version }: AttachDatasetListItemProps) => {
  const { projects: projectIds } = version;

  const [open, setOpen] = useState(false);

  const { user, isLoading: isUserLoading } = useKeycloakUser();

  const queryClient = useQueryClient();
  const { mutateAsync: attachFile, error } = useAttachFile<AxiosError<DMError>>();
  const errorMessage = error?.response?.data.error;

  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjects();
  const projects = projectsData?.projects.filter(
    ({ editors }) => user.username && editors.includes(user.username),
  );

  const { data: typesData, isLoading: isTypesLoading } = useGetFileTypes();
  const types = typesData?.types;

  const initialValues: FormState = {
    project: projects?.[0]?.project_id ?? '',
    type: version.type,
    path: '',
    isImmutable: true,
    isCompress: false,
  };

  const projectNames = useGetAttachedProjectsNames(projectIds, projectsData?.projects);

  return (
    <>
      <ListItem
        button
        disabled={isProjectsLoading || isTypesLoading || isUserLoading}
        onClick={() => setOpen(true)}
      >
        <ListItemText
          primary="Attach Dataset to a Project"
          secondary={
            <>
              Creates a file in the project linked to the selected version
              {!!projectNames.length && (
                <>
                  <br />
                  Currently attached to: {projectNames.join(', ')}
                </>
              )}
            </>
          }
        />
        <AttachFileRoundedIcon color="action" />
      </ListItem>

      <FormikModalWrapper
        // Reinitialize to allow a project to be selected by default after the async action is
        // completed
        enableReinitialize
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id={`attach-dataset-${datasetId}`}
        initialValues={initialValues}
        open={open}
        submitText="Attach"
        title={`Attach ${version.file_name} v${version.version} to a Project`}
        validationSchema={yup.object({
          path: yup.string().matches(/^\/([A-z0-9-_+]+\/)*([A-z0-9]+)$/gm, 'Invalid Path'),
        })}
        onClose={() => setOpen(false)}
        onSubmit={async ({ project, type, path, isImmutable, isCompress }, { setSubmitting }) => {
          try {
            await attachFile({
              data: {
                dataset_version: version.version,
                dataset_id: datasetId,
                project_id: project,
                immutable: isImmutable,
                compress: isCompress,
                as_type: type,
                path: path || '/',
              },
            });

            await Promise.all([
              // Ensure the views showing project files is updated to include the new addition
              queryClient.invalidateQueries(getGetProjectQueryKey(project)),
              // Ensure that the dataset's details display the project's name in the used in projects
              // field
              queryClient.invalidateQueries(getGetDatasetsQueryKey()),
            ]);

            setOpen(false);
          } catch (err) {
            console.error(err);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <FormControl fullWidth margin="dense">
          <Field select component={TextField} id="select-project" label="Project" name="project">
            {(projects ?? []).map((project) => (
              <MenuItem key={project.project_id} value={project.project_id}>
                {project.name}
              </MenuItem>
            ))}
          </Field>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <Field
            select
            component={TextField}
            helperText="The desired Dataset file type (a MIME type). Whether or not the chosen fileType is supported will depend on the Dataset."
            id="select-type"
            label="File Type"
            name="type"
          >
            {(types ?? [])
              .sort((a, b) => a.mime.localeCompare(b.mime)) // Sort alphabetically
              .map((type) => (
                <MenuItem key={type.mime} value={type.mime}>
                  {type.mime}
                </MenuItem>
              ))}
          </Field>
        </FormControl>

        <FormGroup row>
          <Field
            component={CheckboxWithLabel}
            Label={{ label: 'Immutable' }}
            name="isImmutable"
            type="checkbox"
          />
          <Field
            component={CheckboxWithLabel}
            Label={{ label: 'Compress' }}
            name="isCompress"
            type="checkbox"
          />
        </FormGroup>

        <FormControl fullWidth margin="normal">
          <Field
            component={TextField}
            helperText="A path within the Project to add the File, default is the project root ('/'), the mount-point within the application container. For example a valid path is '/path/subpath'."
            label="Path"
            name="path"
          />
        </FormControl>

        {errorMessage && (
          <Alert severity="error">
            <b>Error:</b> {errorMessage}
          </Alert>
        )}
      </FormikModalWrapper>
    </>
  );
};
