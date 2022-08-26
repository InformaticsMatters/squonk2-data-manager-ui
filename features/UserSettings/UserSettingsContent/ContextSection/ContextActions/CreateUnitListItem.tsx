import { useState } from "react";
import { useQueryClient } from "react-query";

import type { AsError } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitsQueryKey,
  getUnit,
  useCreateOrganisationUnit,
  useGetOrganisationUnits,
} from "@squonk/account-server-client/unit";

import { CreateNewFolder } from "@mui/icons-material";
import { Grid, ListItem, ListItemText } from "@mui/material";
import { Field, Form, Formik } from "formik";
import { TextField } from "formik-mui";
import * as yup from "yup";

import { ModalWrapper } from "../../../../../components/modals/ModalWrapper";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { useSelectedUnit } from "../../../../../state/unitSelection";

/**
 * Button which allows organisation owner to create a new project.
 */
export const CreateUnitListItem = () => {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  const [, setUnit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  const { data } = useGetOrganisationUnits(organisation?.id ?? "", {
    query: { enabled: !!organisation?.id },
  });
  const units = data?.units;

  const { mutateAsync: createOrganisationUnit } = useCreateOrganisationUnit();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError>();

  const changeContext = async (unitId: string) => {
    try {
      const unitResponse = await getUnit(unitId);
      setUnit(unitResponse);
    } catch (error) {
      // For now only log the error, don't display anything to the user
      console.error(error);
    }
  };

  const create = async (name: string) => {
    if (organisation) {
      const { id: unitId } = await createOrganisationUnit({
        orgId: organisation.id,
        data: { name },
      });

      enqueueSnackbar("Unit created");

      queryClient.invalidateQueries(getGetOrganisationUnitsQueryKey(organisation.id));
      queryClient.invalidateQueries(getGetUnitsQueryKey());

      // Change context outside of this try-catch block
      changeContext(unitId);
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
        initialValues={{ name: "" }}
        validationSchema={yup.object().shape({
          name: yup
            .string()
            .required("A unit name is required")
            .test(
              "does-not-exist-already",
              "The name is already used for a unit",
              (name) => name !== undefined && !units?.map((unit) => unit.name).includes(name),
            )
            .min(2, "The name is too short"),
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
            DialogProps={{ maxWidth: "sm", fullWidth: true }}
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
