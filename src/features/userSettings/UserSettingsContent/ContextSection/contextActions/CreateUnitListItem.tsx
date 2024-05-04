import { useState } from "react";

import { type AsError } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitsQueryKey,
  getUnit,
  useCreateOrganisationUnit,
  useGetOrganisationUnits,
} from "@squonk/account-server-client/unit";

import { CreateNewFolder } from "@mui/icons-material";
import { Grid, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { TextField } from "formik-mui";
import * as yup from "yup";

import { ModalWrapper } from "../../../../../components/modals/ModalWrapper";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";
import { useSelectedUnit } from "../../../../../state/unitSelection";
import { getBillingDay } from "../../../../../utils/app/products";

/**
 * Button which allows organisation owners to create a new unit.
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
        data: { name, billing_day: getBillingDay() },
      });

      enqueueSnackbar("Unit created");

      void queryClient.invalidateQueries({
        queryKey: getGetOrganisationUnitsQueryKey(organisation.id),
      });
      void queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey() });

      // Change context outside of this try-catch block
      void changeContext(unitId);
    }
  };

  return (
    <>
      <ListItemButton onClick={() => setOpen(true)}>
        <ListItemText
          primary="Create Unit"
          secondary="Creates a new unit in the currently selected organisation"
        />
        <ListItemIcon>
          <CreateNewFolder color="action" />
        </ListItemIcon>
      </ListItemButton>

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
              (name) => !units?.map((unit) => unit.name).includes(name),
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
            onSubmit={() => void submitForm()}
          >
            <Form>
              <Grid container marginY={2} spacing={1}>
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
