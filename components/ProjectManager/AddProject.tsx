import type { FC } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetProjectsQueryKey,
  useCreateProject,
  useGetProjects,
} from '@squonk/data-manager-client/project';
import { getGetUserAccountQueryKey, useGetUserAccount } from '@squonk/data-manager-client/user';

import { css } from '@emotion/react';
import {
  Button,
  FormGroup,
  Grid,
  IconButton,
  MenuItem,
  Popover,
  Tooltip,
  useTheme,
} from '@material-ui/core';
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import * as yup from 'yup';

interface AddProjectProps {
  inverted?: boolean;
}

export const AddProject: FC<AddProjectProps> = ({ inverted = false }) => {
  const theme = useTheme();

  const popupState = usePopupState({ variant: 'popover', popupId: `add-project` });

  const queryClient = useQueryClient();

  const { data: projectsData } = useGetProjects();
  const projects = projectsData?.projects;

  const { data: userAccountData } = useGetUserAccount();
  const availableEntitlements = userAccountData?.project_entitlements.filter(
    (entitlement) => entitlement.available,
  );
  const entitlementsAvailable = (availableEntitlements ?? []).length > 0;

  const { mutateAsync: createProject } = useCreateProject();

  return (
    <>
      <Tooltip
        arrow
        title={
          entitlementsAvailable
            ? 'Add new project'
            : 'You do not have any entitlements to create projects'
        }
      >
        <span>
          <IconButton
            color={inverted ? 'inherit' : 'default'}
            {...bindTrigger(popupState)}
            disabled={!entitlementsAvailable}
          >
            <AddCircleRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Popover
        css={css`
          .MuiPopover-paper {
            min-width: 500px;
          }
        `}
        {...bindPopover(popupState)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Formik
          validateOnMount
          initialValues={{ projectName: '', entitlement: '' }}
          validationSchema={yup.object().shape({
            projectName: yup
              .string()
              .required('A project name is required')
              .test(
                'does-not-exist',
                'The name is already used for a project',
                (name) =>
                  name !== undefined && !projects?.map((project) => project.name).includes(name),
              ),
            entitlement: yup.string().required('A tier must be selected'),
          })}
          onSubmit={async ({ projectName, entitlement }) => {
            await createProject({ data: { name: projectName, entitlement_id: entitlement } });

            popupState.close();

            queryClient.invalidateQueries(getGetProjectsQueryKey());
            queryClient.invalidateQueries(getGetUserAccountQueryKey());
          }}
        >
          {({ submitForm, isSubmitting, isValid }) => (
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={5}>
                  <Field
                    autoFocus
                    fullWidth
                    component={TextField}
                    label="Project Name"
                    name="projectName"
                  />
                </Grid>
                <Grid item xs={5}>
                  <Field
                    fullWidth
                    select
                    component={TextField}
                    label="Select Tier"
                    name="entitlement"
                  >
                    {availableEntitlements?.map((entitlement) => (
                      <MenuItem key={entitlement.id} value={entitlement.id}>
                        {entitlement.tier}
                      </MenuItem>
                    ))}
                  </Field>
                </Grid>
                <Grid item xs={2}>
                  <Button disabled={isSubmitting || !isValid} onClick={submitForm}>
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Popover>
    </>
  );
};
