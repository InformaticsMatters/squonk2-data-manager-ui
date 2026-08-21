import { useState } from "react";

import { Button, Stack, TextField, Typography } from "@mui/material";
import { useForm, useStore } from "@tanstack/react-form";
import { useSnackbar } from "notistack";
import { z } from "zod/mini";

import { ModalWrapper } from "../components/modals/ModalWrapper";
import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { useCreateUnitCommand } from "../hooks/useUnitCommands";
import { useUnitCreationFacts } from "../hooks/useUnitCreationFacts";
import { capabilityIsEnabled, capabilityReason, type ProjectCapability } from "./capabilities";
import { unitCreationFailureReason } from "./failures";
import { decideIndexUnitOffer } from "./projectIndex";
import { usePersonalUnitCreation } from "./usePersonalUnitCreation";

/**
 * The unit the projects index offers beside **Create project**.
 *
 * The index lists the projects of one organisation, and a project must go in a unit of it. A caller
 * with no unit there can therefore read the whole screen without finding the thing they are
 * missing, which is what this action answers: it says which unit the organisation in effect holds
 * for them, whether they may take it, and why not when they may not. Administration keeps sole
 * ownership of everything else a unit has — this creates one and stops.
 *
 * Nothing navigates. The caller stays on the index they were reading, the new unit is announced by
 * name, and the generated caches the commands refresh are what make it immediately usable by
 * project creation and by the onboarding offer.
 */

/**
 * One capability-governed action in the index header. A hidden capability renders nothing; every
 * other status renders the control with its reason beneath it, disabled unless enabled — the same
 * presentation Administration gives a capability, written here because presentation is the family's
 * own and the rule behind it is what the two share.
 *
 * The reason is associated with the control rather than merely placed near it, so a caller who
 * cannot use the action hears why along with its name.
 */
const CapabilityButton = ({
  capability,
  children,
  id,
  isPending,
  onClick,
}: {
  capability: ProjectCapability;
  children: string;
  id: string;
  isPending: boolean;
  onClick: () => void;
}) => {
  if (capability.status === "hidden") {
    return null;
  }
  const reason = capabilityReason(capability);

  return (
    <Stack spacing={0.5} sx={{ alignItems: { sm: "flex-start" } }}>
      <Button
        aria-describedby={reason ? `${id}-reason` : undefined}
        disabled={!capabilityIsEnabled(capability) || isPending}
        variant="outlined"
        onClick={onClick}
      >
        {children}
      </Button>
      {reason ? (
        <Typography color="text.secondary" id={`${id}-reason`} variant="body2">
          {reason}
        </Typography>
      ) : null}
    </Stack>
  );
};

/** A unit's name is the caller's to choose, so a clash is refused before it is sent, not after. */
const unitNameSchema = (existingNames: string[]) =>
  z.object({
    name: z.string().check(
      z.minLength(2, "The name is too short"),
      z.refine((name) => !existingNames.includes(name), {
        message: "The name is already used for a unit",
      }),
    ),
  });

const CreateUnitModal = ({
  existingNames,
  isPending,
  onClose,
  onSubmit,
  open,
}: {
  existingNames: string[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (created: { name: string }) => Promise<void>;
  open: boolean;
}) => {
  const form = useForm({
    defaultValues: { name: "" },
    validators: { onChange: unitNameSchema(existingNames) },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });
  // Subscribed rather than read off the form, because only a subscription re-renders the action
  // when the name being typed becomes one this organisation would refuse.
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "sm", fullWidth: true }}
      id="projects-create-unit"
      open={open}
      submitDisabled={!canSubmit || isPending}
      submitText={isPending ? "Creating..." : "Create"}
      title="Create unit"
      onClose={onClose}
      onSubmit={() => void form.handleSubmit()}
    >
      <Stack spacing={2} sx={{ my: 2 }}>
        <form.Field name="name">
          {(field) => (
            <TextField
              autoFocus
              fullWidth
              error={field.state.meta.errors.length > 0}
              helperText={field.state.meta.errors.map((error) => error?.message)[0]}
              label="Unit name"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </form.Field>
      </Stack>
    </ModalWrapper>
  );
};

const NamedUnitOffer = ({
  capability,
  existingUnitNames,
  organisationId,
}: {
  capability: ProjectCapability;
  existingUnitNames: string[];
  organisationId: string;
}) => {
  const createUnit = useCreateUnitCommand();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const create = async ({ name }: { name: string }) => {
    setIsPending(true);
    try {
      await createUnit(organisationId, name);
      setOpen(false);
      enqueueSnackbar(`Unit ${name} created`, { variant: "success" });
    } catch (error) {
      const reason = unitCreationFailureReason(error);
      reason ? enqueueSnackbar(reason, { variant: "error" }) : enqueueError(error);
    }
    setIsPending(false);
  };

  return (
    <>
      <CapabilityButton
        capability={capability}
        id="projects-unit-offer"
        isPending={isPending}
        onClick={() => setOpen(true)}
      >
        Create unit
      </CapabilityButton>
      <CreateUnitModal
        existingNames={existingUnitNames}
        isPending={isPending}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={create}
      />
    </>
  );
};

const PersonalUnitOffer = ({ capability }: { capability: ProjectCapability }) => {
  const { createPersonalUnit, state } = usePersonalUnitCreation();
  const { enqueueSnackbar } = useSnackbar();

  const create = async () => {
    const outcome = await createPersonalUnit();
    if (outcome.kind === "failed") {
      enqueueSnackbar(outcome.reason, { variant: "error" });
      return;
    }
    enqueueSnackbar(
      outcome.unit ? `Personal unit ${outcome.unit.name} created` : "Personal unit created",
      { variant: "success" },
    );
  };

  return (
    <CapabilityButton
      capability={capability}
      id="projects-unit-offer"
      isPending={state.kind === "creating"}
      onClick={() => void create()}
    >
      {state.kind === "creating" ? "Creating..." : "Create personal unit"}
    </CapabilityButton>
  );
};

export const UnitOffer = ({
  existingUnitNames,
  organisationId,
}: {
  existingUnitNames: string[];
  organisationId: string | undefined;
}) => {
  const facts = useUnitCreationFacts(organisationId);
  const offer = decideIndexUnitOffer(facts);

  // An offer is only ever named for an organisation, so the two are absent together; the second
  // check is what tells the types that, and is not a case of its own.
  if (offer === undefined || organisationId === undefined) {
    return null;
  }
  return offer.kind === "personal" ? (
    <PersonalUnitOffer capability={offer.capability} />
  ) : (
    <NamedUnitOffer
      capability={offer.capability}
      existingUnitNames={existingUnitNames}
      organisationId={organisationId}
    />
  );
};
