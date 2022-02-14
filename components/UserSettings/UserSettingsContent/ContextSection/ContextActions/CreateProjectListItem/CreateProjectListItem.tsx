import { useState } from 'react';
import { useQueryClient } from 'react-query';

import type {
  AsError,
  UnitProductPostBodyBody,
  UnitProductPostBodyBodyFlavour,
} from '@squonk/account-server-client';
import {
  getGetProductsForUnitQueryKey,
  useCreateUnitProduct,
} from '@squonk/account-server-client/product';
import type { DmError } from '@squonk/data-manager-client';
import {
  getGetProjectsQueryKey,
  useCreateProject,
  useGetProjects,
} from '@squonk/data-manager-client/project';
import { getGetUserAccountQueryKey } from '@squonk/data-manager-client/user';

import { Grid, ListItem, ListItemText, MenuItem, Typography } from '@material-ui/core';
import { NoteAdd } from '@material-ui/icons';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import * as yup from 'yup';

import { useOrganisationUnit } from '../../../../../../context/organisationUnitContext';
import { useCurrentProjectId } from '../../../../../../hooks/projectHooks';
import { useEnqueueError } from '../../../../../../hooks/useEnqueueStackError';
import { getErrorMessage } from '../../../../../../utils/orvalError';
import { formatTierString, getBillingDay } from '../../../../../../utils/productUtils';
import { ModalWrapper } from '../../../../../modals/ModalWrapper';
import { useGetProjectProductTypes } from './useGetProjectProductTypes';

/**
 * Button which allows user to create a new project.
 */
export const CreateProjectListItem = () => {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  const {
    organisationUnit: { organisation, unit },
  } = useOrganisationUnit();
  const { projectProductTypes, isLoading, isError, error } = useGetProjectProductTypes();

  const { data: projectsData } = useGetProjects();
  const projects = projectsData?.projects;

  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: createProduct } = useCreateUnitProduct();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError | AsError>();

  const { setCurrentProjectId } = useCurrentProjectId();

  const create = async (projectName: string, flavour: string, serviceId: number) => {
    if (organisation && unit) {
      const { id: productId } = await createProduct({
        unitid: unit.id,
        data: {
          name: projectName,
          type: 'DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION',
          billing_day: getBillingDay(),
          flavour: flavour as UnitProductPostBodyBodyFlavour, // TODO is this recent?
          service_id: serviceId, // TODO this is missing as well
        } as UnitProductPostBodyBody,
      });

      const { project_id } = await createProject({
        data: {
          name: projectName,
          organisation_id: organisation.id,
          unit_id: unit.id,
          tier_product_id: productId,
        },
      });

      enqueueSnackbar('Project created');

      queryClient.invalidateQueries(getGetProjectsQueryKey());
      queryClient.invalidateQueries(getGetUserAccountQueryKey());

      queryClient.invalidateQueries(getGetProductsForUnitQueryKey(unit.id));

      setCurrentProjectId(project_id);
    }
  };

  return (
    <>
      <ListItem button onClick={() => setOpen(true)}>
        <ListItemText
          primary="Create Project"
          secondary="Creates a new project in the currently selected context"
        />
        <NoteAdd color="action" />
      </ListItem>

      <Formik
        validateOnMount
        initialValues={{ projectName: '', flavour: '', serviceId: 0 }}
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
          flavour: yup.string().required('A tier must be selected'),
        })}
        onSubmit={async ({ projectName, flavour, serviceId }, { setSubmitting, resetForm }) => {
          try {
            await create(projectName, flavour, serviceId);
            resetForm();
          } catch (error) {
            enqueueError(error);
          } finally {
            setSubmitting(false);
            setOpen(false);
          }
        }}
      >
        {({ submitForm, isSubmitting, isValid, setFieldValue }) => (
          <ModalWrapper
            DialogProps={{ maxWidth: 'sm', fullWidth: true }}
            id="create-project"
            open={open}
            submitDisabled={isSubmitting || !isValid}
            submitText="Create"
            title="Create Project"
            onClose={() => setOpen(false)}
            onSubmit={submitForm}
          >
            <Form>
              <Grid container spacing={1}>
                <Grid container item>
                  <Field
                    autoFocus
                    fullWidth
                    component={TextField}
                    label="Project Name"
                    name="projectName"
                  />
                </Grid>
                <Grid container item>
                  {isError ? (
                    <Typography color="error">{getErrorMessage(error)}</Typography>
                  ) : (
                    <Field fullWidth select component={TextField} label="Tier" name="flavour">
                      {isLoading ? (
                        <MenuItem disabled>Loading</MenuItem>
                      ) : (
                        projectProductTypes?.map((product) => {
                          return (
                            <MenuItem
                              key={product.flavour}
                              value={product.flavour}
                              onClick={() => setFieldValue('serviceId', product.service.id)}
                            >
                              {formatTierString(product.flavour)}
                            </MenuItem>
                          );
                        })
                      )}
                    </Field>
                  )}
                </Grid>
              </Grid>
            </Form>
          </ModalWrapper>
        )}
      </Formik>
    </>
  );
};
