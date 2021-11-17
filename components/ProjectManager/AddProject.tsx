import { useQueryClient } from 'react-query';

import {
  getGetProjectsQueryKey,
  useCreateProject,
  useGetProjects,
} from '@squonk/data-manager-client/project';
import { getGetUserAccountQueryKey } from '@squonk/data-manager-client/user';

import { css } from '@emotion/react';
import { Button, Grid, IconButton, MenuItem, Popover, Tooltip, useTheme } from '@material-ui/core';
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import * as yup from 'yup';

import { ORG_ID, PRODUCT_TIERS, UNIT_ID } from '../../utils/ASIdentities';
import type { CommonProps } from './types';

export type AddProjectProps = Pick<CommonProps, 'inverted'>;

/**
 * Button with a Popover that allows the user to create a new project.
 */
export const AddProject = ({ inverted = false }: AddProjectProps) => {
  const popupState = usePopupState({ variant: 'popover', popupId: `add-project` });

  const queryClient = useQueryClient();

  const { data: projectsData } = useGetProjects();
  const projects = projectsData?.projects;

  const { mutateAsync: createProject } = useCreateProject();

  const theme = useTheme();

  return (
    <>
      <Tooltip title="Add new project">
        <span>
          <IconButton color={inverted ? 'inherit' : 'default'} {...bindTrigger(popupState)}>
            <AddCircleRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Popover
        css={css`
          .MuiPopover-paper {
            padding: ${theme.spacing(1)}px;
            min-width: 500px;
          }
        `}
        {...bindPopover(popupState)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Formik
          validateOnMount
          initialValues={{ projectName: '', tierProductId: '' }}
          validationSchema={yup.object().shape({
            projectName: yup
              .string()
              .required('A project name is required')
              .test(
                'does-not-exist',
                'The name is already used for a project',
                (name) =>
                  name !== undefined && !projects?.map((project) => project.name).includes(name),
              )
              .min(2, 'The name is too short'),
            tierProductId: yup.string().required('A tier must be selected'),
          })}
          onSubmit={async ({ projectName, tierProductId }) => {
            await createProject({
              data: {
                name: projectName,
                organisation_id: ORG_ID,
                unit_id: UNIT_ID,
                tier_product_id: tierProductId,
              },
            });

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
                  <Field fullWidth select component={TextField} label="Tier" name="tierProductId">
                    {Object.entries(PRODUCT_TIERS).map(([key, value]) => {
                      return (
                        <MenuItem key={value} value={value}>
                          {key}
                        </MenuItem>
                      );
                    })}
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
