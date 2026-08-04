import { type ReactNode, useState } from "react";

import {
  type AsError,
  type OrganisationAllDetail,
  type UnitAllDetail,
  UnitAllDetailDefaultProductPrivacy,
} from "@/api/account-server";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { Box, Button, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/router";
import { z } from "zod/mini";

import { ManageUsers } from "../components/ManageUsers";
import { ModalWrapper } from "../components/modals/ModalWrapper";
import { WarningDeleteButton } from "../components/WarningDeleteButton";
import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { capitalise, shoutSnakeToLowerCase } from "../utils/app/language";
import { type UnitWithOrganisation, useAccessFacts, useAccessIndex } from "./accessFacts";
import {
  type AdministrationCapability,
  capabilityReason,
  evaluateOrganisationCreationCapability,
  evaluateOrganisationEditorCapability,
  evaluatePersonalUnitCreationCapability,
  evaluateUnitCreationCapability,
  evaluateUnitDeletionCapability,
  evaluateUnitEditCapability,
  evaluateUnitMembershipCapability,
  isDefaultOrganisationResource,
  isPersonalUnitResource,
} from "./capabilities";
import { administrationMutationFailureMessage, administrationResourceLabel } from "./failures";
import { assertOrganisationId, assertUnitId } from "./identifiers";
import { MissingResource, PageTitle, ResourceIdentity, ResourceLink } from "./resources";
import { administrationLinks, type AdministrationRoute } from "./routes";
import { useAccessCommands } from "./useAccessCommands";

export type OrganisationAccessResourceRoute = Extract<
  AdministrationRoute,
  { kind: "organisation-access-resource" }
>;

const task = "Organisation & access";

const nameSchema = (existingNames: string[], subject: string) =>
  z.object({
    name: z.string().check(
      z.minLength(2, "The name is too short"),
      z.refine((name) => !existingNames.includes(name), {
        message: `The name is already used for a ${subject}`,
      }),
    ),
    owner: z.string().check(z.minLength(1, "The username for the owner is required")),
  });

/**
 * Every Organisation & access command reports the same way: success is announced, an authoritative
 * rejection explains that the displayed resource is unchanged, and anything the transport cannot
 * classify falls through to the shared error presentation.
 */
const useAccessCommandFeedback = () => {
  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError>();
  return {
    announce: (message: string) => enqueueSnackbar(message, { variant: "success" }),
    report: (error: unknown, action: string, resource: string) => {
      const message = administrationMutationFailureMessage(error, action, resource);
      message ? enqueueSnackbar(message, { variant: "error" }) : enqueueError(error);
    },
    warn: (message: string) => enqueueSnackbar(message, { variant: "warning" }),
  };
};

const CapabilityAction = ({
  capability,
  children,
}: {
  capability: AdministrationCapability;
  children: (state: { disabled: boolean }) => ReactNode;
}) => {
  if (capability.status === "hidden") {
    return null;
  }
  return (
    <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
      {children({ disabled: capability.status === "disabled" })}
      {capability.reason ? (
        <Typography color="text.secondary" variant="body2">
          {capability.reason}
        </Typography>
      ) : null}
    </Stack>
  );
};

const Section = ({ children, title }: { children: ReactNode; title: string }) => (
  <Box sx={{ mt: 3 }}>
    <Typography gutterBottom component="h4" variant="h6">
      {title}
    </Typography>
    {children}
  </Box>
);

const ResourceChip = ({ label }: { label: string }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
    <Chip label={label} size="small" variant="outlined" />
  </Stack>
);

/**
 * Collects the name, and for organisations the owner, of a resource about to be created. The owner
 * defaults to the caller but stays editable, because a platform administrator creates organisations
 * on behalf of other users.
 */
const CreateResourceModal = ({
  defaultOwner,
  existingNames,
  id,
  onClose,
  onSubmit,
  open,
  subject,
  title,
  withOwner = false,
}: {
  defaultOwner: string;
  existingNames: string[];
  id: string;
  onClose: () => void;
  onSubmit: (created: { name: string; owner: string }) => Promise<void>;
  open: boolean;
  subject: string;
  title: string;
  withOwner?: boolean;
}) => {
  const form = useForm({
    defaultValues: { name: "", owner: defaultOwner },
    validators: { onChange: nameSchema(existingNames, subject) },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "sm", fullWidth: true }}
      id={id}
      open={open}
      submitDisabled={!form.state.canSubmit}
      submitText="Create"
      title={title}
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
              label={`${capitalise(subject)} name`}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </form.Field>
        {!!withOwner && (
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
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </form.Field>
        )}
      </Stack>
    </ModalWrapper>
  );
};

/**
 * Adds and removes one user at a time from a resource that owns a user list. Failures leave the
 * displayed list untouched; the refreshed generated resource is the only source of truth.
 */
const ManageResourceUsers = ({
  add,
  capability,
  disabledUsers,
  noun,
  remove,
  resource,
  title,
  users,
}: {
  add: (userId: string) => Promise<unknown>;
  capability: AdministrationCapability;
  disabledUsers?: string[];
  noun: string;
  remove: (userId: string) => Promise<unknown>;
  resource: string;
  title: string;
  users: string[];
}) => {
  const feedback = useAccessCommandFeedback();
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const change = async (
    username: string | undefined,
    verb: "added" | "removed",
    command: (userId: string) => Promise<unknown>,
  ) => {
    if (username === undefined) {
      feedback.warn("Username not found");
      return;
    }
    setIsLoading(true);
    try {
      await command(username);
      setInput("");
      feedback.announce(`${noun} ${username} ${verb}`);
    } catch (error) {
      feedback.report(error, `manage ${noun.toLowerCase()}s of`, resource);
    }
    setIsLoading(false);
  };

  return (
    <ManageUsers
      disabled={capability.status !== "enabled"}
      disabledUsers={disabledUsers}
      helperText={capabilityReason(capability)}
      inputValue={input}
      isLoading={isLoading}
      title={title}
      users={users}
      onInputChange={setInput}
      onRemove={async (_, changedUser) => change(changedUser, "removed", remove)}
      onSelect={async (_, changedUser) => {
        setInput(changedUser ?? "");
        await change(changedUser, "added", add);
      }}
    />
  );
};

const CreateOrganisationAction = ({
  organisations,
}: {
  organisations: OrganisationAllDetail[];
}) => {
  const [open, setOpen] = useState(false);
  const { caller } = useAccessFacts();
  const commands = useAccessCommands();
  const feedback = useAccessCommandFeedback();
  const router = useRouter();
  const capability = evaluateOrganisationCreationCapability(caller);
  const owner = caller.username;

  // The capability is only enabled once the generated caller account names an owner to create for.
  if (capability.status === "hidden" || owner === undefined) {
    return null;
  }

  const create = async (created: { name: string; owner: string }) => {
    try {
      const { id } = await commands.createOrganisation(created);
      feedback.announce("Organisation created");
      setOpen(false);
      await router.push(
        administrationLinks.organisationAccessResource(
          "organisations",
          assertOrganisationId(id),
        ) as never,
      );
    } catch (error) {
      feedback.report(error, "create", administrationResourceLabel.newOrganisation);
    }
  };

  return (
    <>
      <CapabilityAction capability={capability}>
        {({ disabled }) => (
          <Button disabled={disabled} variant="outlined" onClick={() => setOpen(true)}>
            Create organisation
          </Button>
        )}
      </CapabilityAction>
      <CreateResourceModal
        withOwner
        defaultOwner={owner}
        existingNames={organisations.map((organisation) => organisation.name)}
        id="create-organisation"
        open={open}
        subject="organisation"
        title="Create organisation"
        onClose={() => setOpen(false)}
        onSubmit={create}
      />
    </>
  );
};

const unitTypeLabel = (unitIdentity: string, personalUnitId: string | undefined) =>
  isPersonalUnitResource(unitIdentity, personalUnitId) ? "Personal unit" : "Unit";

export const OrganisationAccessIndex = () => {
  const { organisations, units } = useAccessIndex();
  const { defaultOrganisationId, personalUnitId } = useAccessFacts();

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Select an organisation or unit to manage it. Every lifecycle action belongs to the resource
        in the address bar.
      </Typography>
      <Box sx={{ mb: 3 }}>
        <CreateOrganisationAction organisations={organisations} />
      </Box>
      {organisations.length === 0 && units.length === 0 ? (
        <MissingResource task={task} />
      ) : (
        <Stack spacing={2}>
          {organisations.map((organisation) => (
            <ResourceLink
              href={administrationLinks.organisationAccessResource(
                "organisations",
                assertOrganisationId(organisation.id),
              )}
              id={organisation.id}
              key={organisation.id}
              name={organisation.name}
              type={
                isDefaultOrganisationResource(organisation.id, defaultOrganisationId)
                  ? "Default organisation"
                  : "Organisation"
              }
            />
          ))}
          {units.map(({ organisation, unit }) => (
            <ResourceLink
              ancestry={organisation.name}
              href={administrationLinks.organisationAccessResource("units", assertUnitId(unit.id))}
              id={unit.id}
              key={unit.id}
              name={unit.name}
              type={unitTypeLabel(unit.id, personalUnitId)}
            />
          ))}
        </Stack>
      )}
    </>
  );
};

const CreateUnitAction = ({
  capability,
  existingNames,
  organisation,
}: {
  capability: AdministrationCapability;
  existingNames: string[];
  organisation: OrganisationAllDetail;
}) => {
  const [open, setOpen] = useState(false);
  const commands = useAccessCommands();
  const feedback = useAccessCommandFeedback();
  const router = useRouter();

  const create = async ({ name }: { name: string }) => {
    try {
      const { id } = await commands.createUnit(organisation.id, name);
      feedback.announce("Unit created");
      setOpen(false);
      await router.push(
        administrationLinks.organisationAccessResource("units", assertUnitId(id)) as never,
      );
    } catch (error) {
      feedback.report(
        error,
        "create a unit in",
        administrationResourceLabel.organisation(organisation.id),
      );
    }
  };

  return (
    <>
      <CapabilityAction capability={capability}>
        {({ disabled }) => (
          <Button disabled={disabled} variant="outlined" onClick={() => setOpen(true)}>
            Create unit
          </Button>
        )}
      </CapabilityAction>
      <CreateResourceModal
        defaultOwner={organisation.owner_id ?? ""}
        existingNames={existingNames}
        id={`create-unit-${organisation.id}`}
        open={open}
        subject="unit"
        title="Create unit"
        onClose={() => setOpen(false)}
        onSubmit={create}
      />
    </>
  );
};

const CreatePersonalUnitAction = ({ capability }: { capability: AdministrationCapability }) => {
  const commands = useAccessCommands();
  const feedback = useAccessCommandFeedback();
  const router = useRouter();

  const create = async () => {
    try {
      const { id } = await commands.createPersonalUnit();
      feedback.announce("Personal unit created");
      await router.push(
        administrationLinks.organisationAccessResource("units", assertUnitId(id)) as never,
      );
    } catch (error) {
      feedback.report(error, "create", administrationResourceLabel.personalUnit);
    }
  };

  return (
    <CapabilityAction capability={capability}>
      {({ disabled }) => (
        <Button disabled={disabled} variant="outlined" onClick={() => void create()}>
          Create personal unit
        </Button>
      )}
    </CapabilityAction>
  );
};

const OrganisationResource = ({
  organisation,
  units,
}: {
  organisation: OrganisationAllDetail;
  units: UnitWithOrganisation[];
}) => {
  const commands = useAccessCommands();
  const { caller, defaultOrganisationId, freshness, personalUnitId } = useAccessFacts();
  const isDefaultOrganisation = isDefaultOrganisationResource(
    organisation.id,
    defaultOrganisationId,
  );
  const facts = { caller, freshness, isDefaultOrganisation, organisation };
  const organisationUnits = units.filter((entry) => entry.organisation.id === organisation.id);

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <ResourceChip label={isDefaultOrganisation ? "Default organisation" : "Organisation"} />
      <ResourceIdentity id={organisation.id} name={organisation.name} type="Organisation" />
      {organisation.owner_id ? (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Owner: {organisation.owner_id}
        </Typography>
      ) : null}

      <Section title="Units">
        {organisationUnits.length === 0 ? (
          <Typography color="text.secondary">
            This organisation has no units you can see.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {organisationUnits.map(({ unit }) => (
              <ResourceLink
                href={administrationLinks.organisationAccessResource(
                  "units",
                  assertUnitId(unit.id),
                )}
                id={unit.id}
                key={unit.id}
                name={unit.name}
                type={unitTypeLabel(unit.id, personalUnitId)}
              />
            ))}
          </Stack>
        )}
        <Stack spacing={2} sx={{ alignItems: "flex-start", mt: 2 }}>
          <CreateUnitAction
            capability={evaluateUnitCreationCapability(facts)}
            existingNames={organisationUnits.map(({ unit }) => unit.name)}
            organisation={organisation}
          />
          <CreatePersonalUnitAction
            capability={evaluatePersonalUnitCreationCapability({
              freshness,
              isDefaultOrganisation,
              personalUnit: personalUnitId === undefined ? "absent" : "present",
            })}
          />
        </Stack>
      </Section>

      <Section title="Editors">
        <ManageResourceUsers
          add={(userId) => commands.addOrganisationEditor(organisation.id, userId)}
          capability={evaluateOrganisationEditorCapability(facts)}
          noun="Editor"
          remove={(userId) => commands.removeOrganisationEditor(organisation.id, userId)}
          resource={administrationResourceLabel.organisation(organisation.id)}
          title="Organisation editors"
          users={organisation.users
            .map((user) => user.id)
            .filter((user) => user !== caller.username)}
        />
      </Section>
    </>
  );
};

const UnitName = ({
  capability,
  unit,
}: {
  capability: AdministrationCapability;
  unit: UnitAllDetail;
}) => {
  const commands = useAccessCommands();
  const feedback = useAccessCommandFeedback();
  const [name, setName] = useState(unit.name);
  const [isPending, setIsPending] = useState(false);
  const disabled = capability.status !== "enabled";

  const rename = async () => {
    setIsPending(true);
    try {
      await commands.updateUnit(unit.id, { name });
      feedback.announce("Unit renamed");
    } catch (error) {
      feedback.report(error, "rename", administrationResourceLabel.unit(unit.id));
    }
    setIsPending(false);
  };

  return (
    <Box sx={{ alignItems: "baseline", display: "flex", gap: 1 }}>
      <TextField
        disabled={disabled}
        helperText={capabilityReason(capability)}
        label="Unit name"
        sx={{ flexGrow: 1 }}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Button
        disabled={disabled || isPending || name === unit.name || name.length < 2}
        onClick={() => void rename()}
      >
        Update
      </Button>
    </Box>
  );
};

const UnitPrivacy = ({
  capability,
  unit,
}: {
  capability: AdministrationCapability;
  unit: UnitAllDetail;
}) => {
  const commands = useAccessCommands();
  const feedback = useAccessCommandFeedback();
  const [isPending, setIsPending] = useState(false);

  const update = async (privacy: UnitAllDetailDefaultProductPrivacy) => {
    setIsPending(true);
    try {
      await commands.updateUnit(unit.id, { default_product_privacy: privacy });
      feedback.announce("Unit default privacy updated");
    } catch (error) {
      feedback.report(
        error,
        "update the default project privacy of",
        administrationResourceLabel.unit(unit.id),
      );
    }
    setIsPending(false);
  };

  return (
    <TextField
      select
      disabled={isPending || capability.status !== "enabled"}
      helperText={capabilityReason(capability)}
      label="Default project privacy"
      value={unit.default_product_privacy}
      onChange={(event) => void update(event.target.value as UnitAllDetailDefaultProductPrivacy)}
    >
      {Object.values(UnitAllDetailDefaultProductPrivacy).map((privacy) => (
        <MenuItem key={privacy} value={privacy}>
          {capitalise(shoutSnakeToLowerCase(privacy))}
        </MenuItem>
      ))}
    </TextField>
  );
};

const DeleteUnitAction = ({
  capability,
  isPersonalUnit,
  unit,
}: {
  capability: AdministrationCapability;
  isPersonalUnit: boolean;
  unit: UnitAllDetail;
}) => {
  const commands = useAccessCommands();
  const feedback = useAccessCommandFeedback();
  const router = useRouter();

  return (
    <CapabilityAction capability={capability}>
      {({ disabled }) => (
        <WarningDeleteButton
          retainOnError
          modalId={`delete-unit-${unit.id}`}
          title="Delete unit"
          tooltipText="Delete this unit"
          onDelete={async () => {
            try {
              await commands.deleteUnit(unit.id, isPersonalUnit);
            } catch (error) {
              feedback.report(error, "delete", administrationResourceLabel.unit(unit.id));
              throw error;
            }
            feedback.announce("Unit deleted");
            await router.replace(administrationLinks.organisationAccess() as never);
          }}
        >
          {({ openModal }) => (
            <Button
              color="error"
              disabled={disabled}
              startIcon={<DeleteForeverIcon />}
              variant="outlined"
              onClick={() => openModal()}
            >
              Delete unit
            </Button>
          )}
        </WarningDeleteButton>
      )}
    </CapabilityAction>
  );
};

const UnitResource = ({ organisation, unit }: UnitWithOrganisation) => {
  const commands = useAccessCommands();
  const { caller, defaultOrganisationId, freshness, personalUnitId } = useAccessFacts();
  const isPersonalUnit = isPersonalUnitResource(unit.id, personalUnitId);
  const facts = {
    caller,
    freshness,
    isDefaultOrganisation: isDefaultOrganisationResource(organisation.id, defaultOrganisationId),
    isPersonalUnit,
    organisation,
    unit,
  };
  const editCapability = evaluateUnitEditCapability(facts);

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <ResourceChip label={unitTypeLabel(unit.id, personalUnitId)} />
      <ResourceIdentity ancestry={organisation.name} id={unit.id} name={unit.name} type="Unit" />
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Owner: {unit.owner_id}
      </Typography>

      <Section title="Name">
        <UnitName capability={editCapability} unit={unit} />
      </Section>

      <Section title="Default project privacy">
        <UnitPrivacy capability={editCapability} unit={unit} />
      </Section>

      <Section title="Members">
        <ManageResourceUsers
          add={(userId) => commands.addUnitMember(unit.id, userId)}
          capability={evaluateUnitMembershipCapability(facts)}
          disabledUsers={[unit.owner_id]}
          noun="Member"
          remove={(userId) => commands.removeUnitMember(unit.id, userId)}
          resource={administrationResourceLabel.unit(unit.id)}
          title="Unit members"
          users={unit.users.map((user) => user.id)}
        />
      </Section>

      <Section title="Deletion">
        <DeleteUnitAction
          capability={evaluateUnitDeletionCapability(facts)}
          isPersonalUnit={isPersonalUnit}
          unit={unit}
        />
      </Section>
    </>
  );
};

export const OrganisationAccessResource = ({
  route,
}: {
  route: OrganisationAccessResourceRoute;
}) => {
  const { organisations, units } = useAccessIndex();

  if (route.collection === "organisations") {
    const organisation = organisations.find((candidate) => candidate.id === route.resourceId);
    return organisation ? (
      <OrganisationResource key={organisation.id} organisation={organisation} units={units} />
    ) : (
      <MissingResource task={task} />
    );
  }

  const match = units.find(({ unit }) => unit.id === route.resourceId);
  return match ? (
    // Keying by identity keeps entered values owned by the resource in the address bar, so a
    // route change never carries another unit's name into the rename field.
    <UnitResource key={match.unit.id} organisation={match.organisation} unit={match.unit} />
  ) : (
    <MissingResource task={task} />
  );
};
