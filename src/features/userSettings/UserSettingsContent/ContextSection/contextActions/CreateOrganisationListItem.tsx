import { useState } from "react";

import { type AsError } from "@squonk/account-server-client";
import {
  getGetOrganisationsQueryKey,
  getOrganisation,
  useCreateOrganisation,
  useGetOrganisations,
} from "@squonk/account-server-client/organisation";

import { CreateNewFolder } from "@mui/icons-material";
import {
  Grid2 as Grid,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { ModalWrapper } from "../../../../../components/modals/ModalWrapper";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../../../../state/organisationSelection";

/**
 * Button which allows organisation owners to create a new project.
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
    const { id: organisationId } = await createOrganisation({ data: { name, owner } });

    const newOrganisation = await getOrganisation(organisationId);

    setOrganisation(newOrganisation);

    enqueueSnackbar("Organisation created");

    void queryClient.invalidateQueries({ queryKey: getGetOrganisationsQueryKey() });

    // Change context outside of this try-catch block
    void changeContext(organisationId);
  };

  // Define Zod schema for validation
  const orgSchema = z.object({
    name: z
      .string()
      .min(2, "The name is too short")
      .refine((name) => !organisations?.map((org) => org.name).includes(name), {
        message: "The name is already used for an organisation",
      }),
    owner: z.string().min(1, "The username for the owner is required"),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      owner: user.username ?? "",
    } as z.infer<typeof orgSchema>,
    validators: {
      onChange: orgSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await create(value.name, value.owner);
        form.reset();
      } catch (error) {
        enqueueError(error);
      } finally {
        setOpen(false);
      }
    },
  });

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

      <ModalWrapper
        DialogProps={{ maxWidth: "sm", fullWidth: true }}
        id="create-organisation"
        open={open}
        submitDisabled={!form.state.canSubmit}
        submitText="Create"
        title="Create Organisation (Admin)"
        onClose={() => setOpen(false)}
        onSubmit={() => void form.handleSubmit()}
      >
        <Grid container spacing={1} sx={{ marginY: 2 }}>
          <Grid container>
            <form.Field name="name">
              {(field) => (
                <TextField
                  autoFocus
                  fullWidth
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors.map((error) => error?.message)[0]}
                  label="Organisation Name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </Grid>
          <Grid container>
            <form.Field name="owner">
              {(field) => (
                <TextField
                  fullWidth
                  // Prevents password managers from suggesting credentials for this field
                  autoComplete="off"
                  error={field.state.meta.errors.length > 0}
                  helperText={field.state.meta.errors.map((error) => error?.message)[0]}
                  label="Owner (username)"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </Grid>
        </Grid>
      </ModalWrapper>
    </>
  );
};
