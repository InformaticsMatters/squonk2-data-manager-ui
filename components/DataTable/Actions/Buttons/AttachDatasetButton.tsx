import type { FC } from 'react';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';

import type {
  DatasetVersionDetail,
  Error as DMError,
  FilePostResponse,
} from '@squonk/data-manager-client';
import { useAttachFile } from '@squonk/data-manager-client/file';
import { getGetProjectQueryKey, useGetProjects } from '@squonk/data-manager-client/project';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { FormControl, FormGroup, IconButton, MenuItem, Tooltip } from '@material-ui/core';
import AttachFileRoundedIcon from '@material-ui/icons/AttachFileRounded';
import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';
import { Field } from 'formik';
import { CheckboxWithLabel, TextField } from 'formik-material-ui';
import * as yup from 'yup';

import { useKeycloakUser } from '../../../../hooks/useKeycloakUser';
import { FormikModalWrapper } from '../../../Modals/FormikModalWrapper';

interface AttachButtonProps {
  datasetId: string;
  versions: DatasetVersionDetail[];
  fileName: string;
}

interface FormState {
  project: string;
  type: string;
  path: string;
  version: DatasetVersionDetail['version'];
  isImmutable: boolean;
  isCompress: boolean;
}

export const AttachDatasetButton: FC<AttachButtonProps> = ({ datasetId, fileName, versions }) => {
  const [open, setOpen] = useState(false);

  const { user, isLoading: isUserLoading } = useKeycloakUser();

  const queryClient = useQueryClient();
  const { mutateAsync: attachFile, error } = useAttachFile<FilePostResponse, AxiosError<DMError>>();
  const errorMessage = error?.response?.data.error;

  const { data: projectsData, isLoading: isProjectsLoading } = useGetProjects();
  const projects = projectsData?.projects.filter(
    ({ editors }) => user.username && editors.includes(user.username),
  );

  const { data: typesData, isLoading: isTypesLoading } = useGetFileTypes();
  const types = typesData?.types;

  const initialValues: FormState = {
    project: projects?.[0]?.project_id ?? '',
    type: versions[0].type,
    path: '',
    version: Math.max(...versions.map(({ version }) => version)),
    isImmutable: true,
    isCompress: false,
  };

  return (
    <>
      <Tooltip title="Attach dataset to a project">
        <span>
          <IconButton
            disabled={isProjectsLoading || isTypesLoading || isUserLoading}
            size="small"
            onClick={() => setOpen(true)}
          >
            <AttachFileRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <FormikModalWrapper
        enableReinitialize
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id={`attach-dataset-${datasetId}`}
        initialValues={initialValues}
        open={open}
        submitText="Attach"
        title={`Attach ${fileName} to project`}
        validationSchema={yup.object({
          path: yup.string().matches(/^\/([A-z0-9-_+]+\/)*([A-z0-9]+)$/gm, 'Invalid Path'),
          version: yup
            .number()
            .test(
              'version-done-stage',
              'The selected version must have finished processing',
              (version) => versions.find((v) => v.version === version)?.processing_stage === 'DONE',
            ),
        })}
        onClose={() => setOpen(false)}
        onSubmit={async (
          { project, type, version, path, isImmutable, isCompress },
          { setSubmitting },
        ) => {
          try {
            await attachFile({
              data: {
                dataset_version: version,
                dataset_id: datasetId,
                project_id: project,
                immutable: isImmutable,
                compress: isCompress,
                as_type: type,
                path: path || '/',
              },
            });
            await queryClient.invalidateQueries(getGetProjectQueryKey(project));
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
          <Field select component={TextField} id="select-version" label="Version" name="version">
            {versions.map((version) => (
              <MenuItem key={version.version} value={version.version}>
                {`v${version.version}`}
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
