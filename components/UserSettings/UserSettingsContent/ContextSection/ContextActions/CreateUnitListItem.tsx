import { useState } from 'react';
import { useQueryClient } from 'react-query';

import type { AsError, UnitDetail } from '@squonk/account-server-client';
import {
  getGetOrganisationUnitsQueryKey,
  useCreateOrganisationUnit,
  useGetOrganisationUnits,
} from '@squonk/account-server-client/unit';

import { Grid, ListItem, ListItemText } from '@material-ui/core';
import { CreateNewFolder } from '@material-ui/icons';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import * as yup from 'yup';

import { AS_API_URL } from '../../../../../constants';
import { useOrganisationUnit } from '../../../../../context/organisationUnitContext';
import { useEnqueueError } from '../../../../../hooks/useEnqueueStackError';
import { ModalWrapper } from '../../../../modals/ModalWrapper';

/**
 * Button which allows organisation owner to create a new project.
 */
export const CreateUnitListItem = () => {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  const {
    organisationUnit: { organisation },
    dispatchOrganisationUnit,
  } = useOrganisationUnit();
  const { data } = useGetOrganisationUnits(organisation?.id ?? '', {
    query: { enabled: !!organisation?.id },
  });
  const units = data?.units;

  const { mutateAsync: createOrganisationUnit } = useCreateOrganisationUnit();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError>();

  const changeContext = async (organisationId: string, unitId: string) => {
    try {
      const unitResponse = await axios.get<UnitDetail>( // TODO change this once AS client is updated
        `${AS_API_URL}/organisation/${organisationId}/unit/${unitId}`,
      );
      dispatchOrganisationUnit({ type: 'setUnit', payload: unitResponse.data });
    } catch (error) {
      // For now only log the error, don't display anything to the user
      console.error(error);
    }
  };

  const create = async (name: string) => {
    if (organisation) {
      const { id: unitId } = await createOrganisationUnit({
        orgid: organisation.id,
        data: {
          name,
        },
      });

      enqueueSnackbar('Unit created');

      queryClient.invalidateQueries(getGetOrganisationUnitsQueryKey(organisation.id));
      queryClient.invalidateQueries(`${AS_API_URL}/unit`); // TODO change this once AS client is updated

      // Change context outside of this try-catch block
      changeContext(organisation.id, unitId);
    }
  };

  return (
    <>
      <ListItem button onClick={() => setOpen(true)}>
        <ListItemText
          primary="Create Unit"
          secondary="Creates a new unit in the currently selected organisation"
        />
        <CreateNewFolder color="action" />
      </ListItem>

      <Formik
        validateOnMount
        initialValues={{ name: '' }}
        validationSchema={yup.object().shape({
          name: yup
            .string()
            .required('A unit name is required')
            .test(
              'does-not-exist',
              'The name is already used for a unit',
              (name) => name !== undefined && !units?.map((unit) => unit.name).includes(name),
            )
            .min(2, 'The name is too short'),
        })}
        onSubmit={async ({ name }, { setSubmitting, resetForm }) => {
          try {
            await create(name);
            resetForm();
          } catch (error) {
            enqueueError(error);
          } finally {
            setOpen(false);
            setSubmitting(false);
          }
        }}
      >
        {({ submitForm, isSubmitting, isValid }) => (
          <ModalWrapper
            DialogProps={{ maxWidth: 'sm', fullWidth: true }}
            id="create-unit"
            open={open}
            submitDisabled={isSubmitting || !isValid}
            submitText="Create"
            title="Create Unit"
            onClose={() => setOpen(false)}
            onSubmit={submitForm}
          >
            <Form>
              <Grid container spacing={1}>
                <Grid container item>
                  <Field autoFocus fullWidth component={TextField} label="Unit Name" name="name" />
                </Grid>
              </Grid>
            </Form>
          </ModalWrapper>
        )}
      </Formik>
    </>
  );
};
