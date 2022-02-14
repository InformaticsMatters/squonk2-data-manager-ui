import { useMutation, useQuery, useQueryClient } from 'react-query';

import type {
  AsError,
  OrganisationDetail,
  UnitDetail,
  UnitProductPostBodyBody,
  UnitProductPostBodyBodyFlavour,
} from '@squonk/account-server-client';
import { useCreateUnitProduct } from '@squonk/account-server-client/product';
import type { DmError } from '@squonk/data-manager-client';
import { getGetProjectsQueryKey, useCreateProject } from '@squonk/data-manager-client/project';
import { getGetUserAccountQueryKey } from '@squonk/data-manager-client/user';

import { css } from '@emotion/react';
import { Box, Button, MenuItem, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import * as yup from 'yup';

import { AS_API_URL } from '../constants';
import { useCurrentProjectId } from '../hooks/projectHooks';
import { useEnqueueError } from '../hooks/useEnqueueStackError';
import { useGetProjectProductTypes } from '../hooks/useGetProjectProductTypes';
import { getErrorMessage } from '../utils/orvalError';
import { formatTierString, getBillingDay } from '../utils/productUtils';

// TODO remove these after AS client is updated
interface OrganisationUnitsGetResponse {
  organisation: OrganisationDetail;
  units: UnitDetail[];
}

interface UnitsGetResponse {
  units: OrganisationUnitsGetResponse[];
}

/**
 * Boostraps a user which doesn't have any units with a default unit and a project
 */
export const UserBootstrapper = () => {
  const theme = useTheme();
  const biggerThanSm = useMediaQuery(theme.breakpoints.up('sm'));

  const queryClient = useQueryClient();

  const { data: unitsData, isLoading: isLoadingUnits } = useQuery<UnitsGetResponse, AsError>(
    `${AS_API_URL}/unit`, // TODO change this once AS client is updated
    async () => {
      const response = await axios.get<UnitsGetResponse>(`${AS_API_URL}/unit`); // TODO change this once AS client is updated
      return response.data;
    },
  );
  const { projectProductTypes, isLoading, isError, error } = useGetProjectProductTypes();

  const { mutateAsync: createUnit } = useMutation(`${AS_API_URL}/unit`, async () => {
    const response = await axios.put(`${AS_API_URL}/unit`);
    return response.data;
  });
  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: createProduct } = useCreateUnitProduct();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError | AsError>();

  const { setCurrentProjectId } = useCurrentProjectId();

  //const hasUnits = unitsData?.units.some((u) => u.units.length);
  const hasUnits = (unitsData?.units || []).length > 1; // TODO remove, only for testing

  const create = async (projectName: string, flavour: string, serviceId: number) => {
    const { id: unitId } = await createUnit();

    const unitsResponse = await axios.get<UnitsGetResponse>(`${AS_API_URL}/unit`); // TODO change this once AS client is updated
    const organisationResponse = unitsResponse.data.units.find((u) =>
      u.units.some((unit) => unit.id === unitId),
    );
    const organisation = organisationResponse?.organisation;

    if (organisation) {
      const { id: productId } = await createProduct({
        unitid: unitId,
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
          unit_id: unitId,
          tier_product_id: productId,
        },
      });

      enqueueSnackbar('Project created');

      // DM
      queryClient.invalidateQueries(getGetProjectsQueryKey());
      queryClient.invalidateQueries(getGetUserAccountQueryKey());

      // AS
      queryClient.invalidateQueries(`${AS_API_URL}/unit`); // TODO change this once AS client is updated

      setCurrentProjectId(project_id);
    }
  };

  if (isLoadingUnits) {
    return null;
  }

  if (!hasUnits) {
    return (
      <Box m={2}>
        <Alert
          css={css`
            .MuiAlert-message {
              width: 100%;
            }
          `}
          severity="info"
        >
          You are not part of any units. You may create a project under a new unit in the default
          organisation.
          <Formik
            validateOnMount
            initialValues={{ projectName: '', flavour: '', serviceId: 0 }}
            validationSchema={yup.object().shape({
              projectName: yup
                .string()
                .required('A project name is required')
                .min(2, 'The name is too short'),
              flavour: yup.string().required('A tier must be selected'),
            })}
            onSubmit={async ({ projectName, flavour, serviceId }, { setSubmitting }) => {
              try {
                await create(projectName, flavour, serviceId);
              } catch (error) {
                enqueueError(error);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ submitForm, isSubmitting, isValid, setFieldValue }) => (
              <Form
                css={css`
                  margin-top: ${theme.spacing()}px;
                `}
              >
                <div
                  css={css`
                    display: grid;
                    grid-template-columns: ${biggerThanSm ? '1fr 1fr auto' : '1fr'};
                    gap: ${theme.spacing()}px;
                    align-items: flex-start;
                    .MuiInputBase-input {
                      background: ${theme.palette.background.paper};
                      border-radius: 4px;
                    }
                  `}
                >
                  <Field
                    autoFocus
                    fullWidth
                    component={TextField}
                    label="Project Name"
                    name="projectName"
                  />
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
                  <Button disabled={isSubmitting || !isValid} onClick={submitForm}>
                    Create
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Alert>
      </Box>
    );
  }

  return null;
};
