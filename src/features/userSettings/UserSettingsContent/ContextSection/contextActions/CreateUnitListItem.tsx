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
import { Grid, ListItemButton, ListItemIcon, ListItemText, TextField } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

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

  // Define Zod schema for validation
  const unitSchema = z.object({
    name: z
      .string()
      .min(2, "The name is too short")
      .refine((name) => !units?.map((unit) => unit.name).includes(name), {
        message: "The name is already used for a unit",
      }),
  });

  const form = useForm({
    defaultValues: { name: "" } as z.infer<typeof unitSchema>,
    validators: { onChange: unitSchema },
    onSubmit: async ({ value }) => {
      try {
        await create(value.name);
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
          primary="Create Unit"
          secondary="Creates a new unit in the currently selected organisation"
        />
        <ListItemIcon>
          <CreateNewFolder color="action" />
        </ListItemIcon>
      </ListItemButton>

      <ModalWrapper
        DialogProps={{ maxWidth: "sm", fullWidth: true }}
        id="create-unit"
        open={open}
        submitDisabled={!form.state.canSubmit}
        submitText="Create"
        title="Create Unit"
        onClose={() => setOpen(false)}
        onSubmit={() => void form.handleSubmit()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
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
                    label="Unit Name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              </form.Field>
            </Grid>
          </Grid>
        </form>
      </ModalWrapper>
    </>
  );
};
