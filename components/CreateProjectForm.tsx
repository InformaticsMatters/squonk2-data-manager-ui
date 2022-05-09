import { useQueryClient } from 'react-query';

import type { AsError, UnitProductPostBodyBodyFlavour } from '@squonk/account-server-client';
import {
  getGetProductsForUnitQueryKey,
  useCreateUnitProduct,
  useGetProductTypes,
} from '@squonk/account-server-client/product';
import { getGetUnitsQueryKey } from '@squonk/account-server-client/unit';
import type { DmError } from '@squonk/data-manager-client';
import { getGetProjectsQueryKey, useCreateProject } from '@squonk/data-manager-client/project';
import { getGetUserAccountQueryKey } from '@squonk/data-manager-client/user';

import { css } from '@emotion/react';
import {
  Button,
  FormControlLabel,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { FormikConfig } from 'formik';
import { Field, Form, Formik } from 'formik';
import { Checkbox, TextField } from 'formik-mui';
import * as yup from 'yup';

import { PROJECT_SUB } from '../constants/products';
import { useCurrentProjectId } from '../hooks/projectHooks';
import { useEnqueueError } from '../hooks/useEnqueueStackError';
import type { Resolve } from '../types';
import { getErrorMessage } from '../utils/orvalError';
import { formatTierString, getBillingDay } from '../utils/productUtils';
import type { FormikModalWrapperProps } from './modals/FormikModalWrapper';
import { FormikModalWrapper } from './modals/FormikModalWrapper';

export type OrgAndUnitIdTuple = [organisationId: string, unitId: string];

export interface CreateProjectFormProps {
  modal?: Resolve<
    Pick<FormikModalWrapperProps, 'id' | 'title' | 'submitText' | 'open' | 'onClose'>
  >;
  orgAndUnit: Resolve<OrgAndUnitIdTuple> | (() => Promise<OrgAndUnitIdTuple>);
}

const getIds = async (orgAndUnit: CreateProjectFormProps['orgAndUnit']) => {
  if (typeof orgAndUnit === 'function') {
    return orgAndUnit();
  }
  return orgAndUnit;
};

const initialValues = { projectName: '', flavour: '', isPrivate: false };

type ProjectFormikProps = FormikConfig<typeof initialValues>;

export const CreateProjectForm = ({ modal, orgAndUnit }: CreateProjectFormProps) => {
  const theme = useTheme();
  const biggerThanSm = useMediaQuery(theme.breakpoints.up('sm'));

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useGetProductTypes();
  const productTypes = data?.product_types.filter(
    (productType) => productType.type === PROJECT_SUB,
  );

  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: createProduct } = useCreateUnitProduct();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError | AsError>();

  const { setCurrentProjectId } = useCurrentProjectId();

  const create = async ({ projectName, flavour, isPrivate }: typeof initialValues) => {
    const [organisationId, unitId] = await getIds(orgAndUnit);
    // Get the (possibly optional) service ID from the selected product type
    const serviceId = productTypes?.find(
      (productType) => productType.flavour === flavour && productType.type === PROJECT_SUB,
    )?.service;
    // The service ID is required so we error here - sadly there isn't much the user can do here
    // This would only happen due to an API error
    // TODO: Report this to Sentry
    if (serviceId === undefined) {
      throw new Error('Service ID was missing in the product type. ');
    }

    const { id: productId } = await createProduct({
      unitId,
      data: {
        name: projectName,
        type: PROJECT_SUB,
        billing_day: getBillingDay(),
        flavour: flavour as UnitProductPostBodyBodyFlavour,
        service_id: serviceId.id,
      },
    });

    const { project_id } = await createProject({
      data: {
        name: projectName,
        organisation_id: organisationId,
        unit_id: unitId,
        tier_product_id: productId,
        private: isPrivate,
      },
    });

    enqueueSnackbar('Project created');

    queryClient.invalidateQueries(getGetProjectsQueryKey());
    queryClient.invalidateQueries(getGetUserAccountQueryKey());

    queryClient.invalidateQueries(getGetProductsForUnitQueryKey(unitId));
    queryClient.invalidateQueries(getGetUnitsQueryKey());

    setCurrentProjectId(project_id);
  };

  const handleSubmit: ProjectFormikProps['onSubmit'] = async (values, { setSubmitting }) => {
    try {
      await create(values);
    } catch (error) {
      enqueueError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const children: ProjectFormikProps['children'] = ({ submitForm, isSubmitting, isValid }) => (
    <Form
      css={css`
        margin-top: ${theme.spacing()};
      `}
    >
      <div
        // Make this a styled component
        css={css`
          display: grid;
          grid-template-columns: ${biggerThanSm ? '1fr 1fr auto auto' : '1fr'};
          gap: ${theme.spacing()};
        `}
      >
        <Field autoFocus fullWidth component={TextField} label="Project Name" name="projectName" />

        {isError ? (
          <Typography color="error">{getErrorMessage(error)}</Typography>
        ) : (
          <Field fullWidth select component={TextField} label="Tier" name="flavour">
            {isLoading ? (
              <MenuItem disabled>Loading</MenuItem>
            ) : (
              productTypes?.map((product) => {
                return (
                  <MenuItem key={product.flavour} value={product.flavour}>
                    {formatTierString(product.flavour ?? 'Unknown Flavour')}
                  </MenuItem>
                );
              })
            )}
          </Field>
        )}

        <FormControlLabel
          control={<Field color="primary" component={Checkbox} name="isPrivate" />}
          label="Private"
          labelPlacement="start"
        />

        {!modal && (
          <Button disabled={isSubmitting || !isValid} onClick={submitForm}>
            Create
          </Button>
        )}
      </div>
    </Form>
  );

  const commonProps: ProjectFormikProps = {
    validateOnMount: true,
    initialValues,
    validationSchema: yup.object().shape({
      projectName: yup
        .string()
        .required('A project name is required')
        .matches(/^[A-Za-z0-9-_.][A-Za-z0-9-_. ]*[A-Za-z0-9-_.]$/),
      flavour: yup.string().required('A tier is required'),
    }),
    onSubmit: handleSubmit,
  };

  return modal ? (
    <FormikModalWrapper {...modal} {...commonProps}>
      {children}
    </FormikModalWrapper>
  ) : (
    <Formik {...commonProps}>{children}</Formik>
  );
};
