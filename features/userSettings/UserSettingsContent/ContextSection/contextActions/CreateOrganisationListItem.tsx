import { useState } from "react";

import type { AsError } from "@squonk/account-server-client";
import {
  getGetOrganisationsQueryKey,
  getOrganisation,
  useCreateOrganisation,
  useGetOrganisations,
} from "@squonk/account-server-client/organisation";

import { CreateNewFolder } from "@mui/icons-material";
import { Grid, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { TextField } from "formik-mui";
import * as yup from "yup";

import { ModalWrapper } from "../../../../../components/modals/ModalWrapper";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";

/**
 * Button which allows organisation owner to create a new project.
 */
export const CreateOrganisationListItem = () => {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useKeycloakUser();

  const { data } = useGetOrganisations();
  const organisations = data?.organisations;

  const [, setOrganisation] = useSelectedOrganisation();

  const { mutateAsync: createOrganisation } = useCreateOrganisation();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError>();

  const changeContext = async (organisationId: string) => {
    try {
      const organisationResponse = await getOrganisation(organisationId);
      setOrganisation(organisationResponse);
    } catch (error) {
      // For now only log the error, don't display anything to the user
      console.error(error);
    }
  };

  const create = async (name: string, owner: string) => {
    const { id: organisationId } = await createOrganisation({
      data: { name, owner },
    });

    const newOrganisation = await getOrganisation(organisationId);

    setOrganisation(newOrganisation);

    enqueueSnackbar("Organisation created");

    queryClient.invalidateQueries({ queryKey: getGetOrganisationsQueryKey() });

    // Change context outside of this try-catch block
    changeContext(organisationId);
  };

  return (
    <>
      <ListItemButton onClick={() => setOpen(true)}>
        <ListItemText
          primary={
            <span>
              Create Organisation <b>(Admin)</b>
            </span>
          }
          secondary="Creates a new organisation"
        />
        <ListItemIcon>
          <CreateNewFolder color="action" />
        </ListItemIcon>
      </ListItemButton>

      <Formik
        validateOnMount
        initialValues={{ name: "", owner: user.username ?? "" }}
        validationSchema={yup.object().shape({
          name: yup
            .string()
            .required("A organisation name is required")
            .test(
              "does-not-exist-already",
              "The name is already used for an organisation",
              (name) => !organisations?.map((organisation) => organisation.name).includes(name),
            )
            .min(2, "The name is too short"),
          owner: yup
            .string()
            .required("The username for the owner is required")
            .test(
              "does-not-exist-already",
              "The name is already used for an organisation",
              (name) => !organisations?.map((organisation) => organisation.name).includes(name),
            ),
        })}
        onSubmit={async ({ name, owner }, { setSubmitting, resetForm }) => {
          try {
            await create(name, owner);
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
            id="create-organisation"
            open={open}
            submitDisabled={isSubmitting || !isValid}
            submitText="Create"
            title="Create Organisation (Admin)"
            onClose={() => setOpen(false)}
            onSubmit={submitForm}
          >
            <Form>
              <Grid container marginY={2} spacing={1}>
                <Grid container item>
                  <Field
                    autoFocus
                    fullWidth
                    component={TextField}
                    label="Organisation Name"
                    name="name"
                  />
                </Grid>
                <Grid container item>
                  <Field
                    autoFocus
                    fullWidth
                    component={TextField}
                    label="Owner (username)"
                    name="owner"
                  />
                </Grid>
              </Grid>
            </Form>
          </ModalWrapper>
        )}
      </Formik>
    </>
  );
};
